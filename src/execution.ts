import * as fs from 'node:fs';
import * as path from 'node:path';
import { type RunResult, runConversion } from './core';
import {
	extractFrontmatter,
	getPageIdFromFrontmatter,
	getTitleFromFrontmatter,
} from './frontmatter';
import { validateInputs } from './inputs';
import { getLogger } from './logger';
import type {
	ActionInputs,
	MultiRunFailure,
	MultiRunItemResult,
	MultiRunResult,
	ResolvedSourceFile,
} from './types';

export type SourceExecutionResult =
	| {
			mode: 'single';
			result: RunResult;
	  }
	| {
			mode: 'multi';
			result: MultiRunResult;
	  };

export async function runSourceExecution(inputs: ActionInputs): Promise<SourceExecutionResult> {
	const sourcePath = path.resolve(inputs.source);

	if (!fs.existsSync(sourcePath)) {
		throw new Error(`Source path not found: ${sourcePath}`);
	}

	const stats = fs.statSync(sourcePath);

	if (stats.isFile()) {
		return {
			mode: 'single',
			result: await runSingleSource(inputs, sourcePath),
		};
	}

	if (!stats.isDirectory()) {
		throw new Error(`Source path must be a Markdown file or directory: ${sourcePath}`);
	}

	const files = resolveMarkdownFiles(sourcePath);
	if (files.length === 0) {
		throw new Error(`No Markdown files found in directory: ${sourcePath}`);
	}

	return {
		mode: 'multi',
		result: await runMultipleSources(inputs, files),
	};
}

export function resolveMarkdownFiles(sourceDirectory: string): ResolvedSourceFile[] {
	const root = path.resolve(sourceDirectory);
	const files = collectMarkdownFiles(root, root);

	files.sort((a, b) => a.displayPath.localeCompare(b.displayPath));
	return files;
}

async function runSingleSource(inputs: ActionInputs, sourcePath: string): Promise<RunResult> {
	const markdown = fs.readFileSync(sourcePath, 'utf-8');
	const { data: frontmatter, content: markdownBody } = extractFrontmatter(markdown);
	const resolvedInputs = createInputsForFile(inputs, sourcePath, frontmatter, {
		allowTitleOverrideInput: true,
	});
	const frontmatterPageId = getPageIdFromFrontmatter(
		frontmatter,
		resolvedInputs.frontmatterPageIdKey
	);
	const pageId = validateInputs(resolvedInputs, frontmatterPageId);

	return runConversion({
		inputs: resolvedInputs,
		markdownContent: markdownBody,
		pageId,
	});
}

async function runMultipleSources(
	inputs: ActionInputs,
	files: ResolvedSourceFile[]
): Promise<MultiRunResult> {
	const logger = getLogger();
	const results: MultiRunItemResult[] = [];
	const failures: MultiRunFailure[] = [];

	if (inputs.pageId) {
		logger.warning('Ignoring page_id input because source is a directory.');
	}

	if (inputs.titleOverride) {
		logger.warning('Ignoring title_override input because source is a directory.');
	}

	for (const file of files) {
		logger.info(`Processing ${file.displayPath}...`);

		try {
			const result = await runSingleSourceForDirectory(inputs, file);
			results.push(result);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			failures.push({
				source: file.displayPath,
				error: message,
			});
			logger.error(`${file.displayPath}: ${message}`);
		}
	}

	return {
		summary: {
			total: files.length,
			succeeded: results.length,
			failed: failures.length,
			updated: results.filter((item) => item.updated).length,
			attachmentsUploaded: results.reduce((sum, item) => sum + item.attachmentsUploaded, 0),
		},
		results,
		failures,
	};
}

async function runSingleSourceForDirectory(
	inputs: ActionInputs,
	file: ResolvedSourceFile
): Promise<MultiRunItemResult> {
	const markdown = fs.readFileSync(file.path, 'utf-8');
	const { data: frontmatter, content: markdownBody } = extractFrontmatter(markdown);
	const resolvedInputs = createInputsForFile(inputs, file.path, frontmatter, {
		allowTitleOverrideInput: false,
	});
	const frontmatterPageId = getPageIdFromFrontmatter(
		frontmatter,
		resolvedInputs.frontmatterPageIdKey
	);
	const pageId = validateInputs(resolvedInputs, frontmatterPageId, { allowInputFallback: false });
	const result = await runConversion({
		inputs: resolvedInputs,
		markdownContent: markdownBody,
		pageId,
	});

	return {
		source: file.displayPath,
		pageUrl: result.outputs.pageUrl,
		pageId: result.outputs.pageId,
		version: result.outputs.version,
		updated: result.outputs.updated,
		attachmentsUploaded: result.outputs.attachmentsUploaded,
		contentHash: result.outputs.contentHash,
	};
}

function createInputsForFile(
	inputs: ActionInputs,
	filePath: string,
	frontmatter: Record<string, unknown>,
	options: {
		allowTitleOverrideInput: boolean;
	}
): ActionInputs {
	const frontmatterTitle = getTitleFromFrontmatter(frontmatter);

	return {
		...inputs,
		source: filePath,
		attachmentsBase: inputs.attachmentsBaseProvided
			? inputs.attachmentsBase
			: path.dirname(filePath),
		titleOverride: options.allowTitleOverrideInput
			? inputs.titleOverride || frontmatterTitle
			: frontmatterTitle,
	};
}

function collectMarkdownFiles(root: string, currentDirectory: string): ResolvedSourceFile[] {
	const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
	const files: ResolvedSourceFile[] = [];

	for (const entry of entries) {
		const fullPath = path.join(currentDirectory, entry.name);

		if (entry.isDirectory()) {
			files.push(...collectMarkdownFiles(root, fullPath));
			continue;
		}

		if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== '.md') {
			continue;
		}

		files.push({
			path: fullPath,
			displayPath:
				path.relative(process.cwd(), fullPath) || path.relative(root, fullPath) || entry.name,
		});
	}

	return files;
}
