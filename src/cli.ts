#!/usr/bin/env node

/**
 * CLI entry point for confluence-md
 * Usage: npx confluence-md <source> [options]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Command } from 'commander';
import { loadConfig } from './cli/config';
import { formatError, formatJsonOutput, printSuccessOutput } from './cli/output';
import { runConversion } from './core';
import { extractFrontmatter, getPageIdFromFrontmatter } from './frontmatter';
import { createInputsFromRaw, validateInputs } from './inputs';
import { createConsoleLogger, createSilentLogger, setLogger } from './logger';

/**
 * CLI options interface
 */
interface CliOptions {
	url?: string;
	email?: string;
	pageId?: string;
	title?: string;
	attachmentsBase?: string;
	imageMode?: string;
	downloadRemoteImages?: boolean;
	skipUnchanged?: boolean;
	dryRun?: boolean;
	json?: boolean;
	verbose?: boolean;
	config?: string;
}

const program = new Command();

program
	.name('confluence-md')
	.description('Convert Markdown (GFM) to Confluence Cloud storage format and update a page')
	.version('1.0.0')
	.argument('<source>', 'Markdown file path')
	.option('-u, --url <url>', 'Confluence base URL (or CONFLUENCE_BASE_URL env)')
	.option('-e, --email <email>', 'Confluence account email (or CONFLUENCE_EMAIL env)')
	.option('-p, --page-id <id>', 'Confluence page ID (or use frontmatter)')
	.option('--title <title>', 'Override page title')
	.option('--attachments-base <path>', 'Base directory for resolving image paths')
	.option('--image-mode <mode>', 'Image handling: upload or external', 'upload')
	.option('--download-remote-images', 'Download remote images as attachments')
	.option('--no-skip-unchanged', 'Update even if content unchanged')
	.option('--dry-run', 'Preview without updating Confluence')
	.option('--json', 'Output results as JSON')
	.option('-v, --verbose', 'Enable verbose output')
	.option('-c, --config <path>', 'Path to config file')
	.action(async (source: string, options: CliOptions) => {
		try {
			await runCli(source, options);
		} catch (error) {
			console.error(formatError(error, options.json ?? false));
			process.exit(1);
		}
	});

/**
 * Main CLI execution logic
 */
async function runCli(source: string, options: CliOptions): Promise<void> {
	// Initialize logger (silent for JSON output)
	initializeLogger(options);

	// Load config file
	const config = loadConfig(options.config);

	// Resolve required inputs from CLI options, env vars, and config
	const apiToken = requireInput(
		process.env.CONFLUENCE_API_TOKEN,
		'API token',
		'Set CONFLUENCE_API_TOKEN environment variable.'
	);
	const confluenceBaseUrl = requireInput(
		options.url || process.env.CONFLUENCE_BASE_URL || config?.confluence_base_url,
		'Confluence URL',
		'Use --url flag, CONFLUENCE_BASE_URL env, or config file.'
	);
	const email = requireInput(
		options.email || process.env.CONFLUENCE_EMAIL || config?.email,
		'Email',
		'Use --email flag, CONFLUENCE_EMAIL env, or config file.'
	);

	// Validate source file exists
	const sourcePath = validateSourceFile(source);

	// Read and parse markdown
	const markdown = fs.readFileSync(sourcePath, 'utf-8');
	const { data: frontmatter, content: markdownBody } = extractFrontmatter(markdown);

	// Create inputs
	const inputs = createInputsFromRaw({
		source: sourcePath,
		confluenceBaseUrl,
		email,
		apiToken,
		pageId: options.pageId || config?.page_id,
		attachmentsBase: options.attachmentsBase || config?.attachments_base,
		titleOverride: options.title || config?.title_override,
		frontmatterPageIdKey: config?.frontmatter_page_id_key,
		imageMode: options.imageMode || config?.image_mode,
		downloadRemoteImages: options.downloadRemoteImages ?? config?.download_remote_images,
		skipIfUnchanged: options.skipUnchanged ?? config?.skip_if_unchanged,
		dryRun: options.dryRun ?? config?.dry_run,
		notifyWatchers: config?.notify_watchers,
	});

	// Get page ID from frontmatter or inputs
	const frontmatterPageId = getPageIdFromFrontmatter(frontmatter, inputs.frontmatterPageIdKey);
	const pageId = validateInputs(inputs, frontmatterPageId);

	// Run conversion
	if (!options.json) {
		console.log(`Converting ${source}...`);
	}

	const result = await runConversion({
		inputs,
		markdownContent: markdownBody,
		pageId,
	});

	// Output results
	outputResults(result.outputs, options, inputs.dryRun);

	process.exit(0);
}

/**
 * Initialize the logger based on options
 */
function initializeLogger(options: CliOptions): void {
	const logger = options.json
		? createSilentLogger()
		: createConsoleLogger(options.verbose ?? false);
	setLogger(logger);
}

/**
 * Require a value or exit with error
 */
function requireInput(value: string | undefined, errorName: string, hint: string): string {
	if (!value) {
		console.error(`Error: ${errorName} required.`);
		console.error(hint);
		process.exit(1);
	}
	return value;
}

/**
 * Validate source file exists and return resolved path
 */
function validateSourceFile(source: string): string {
	const sourcePath = path.resolve(source);
	if (!fs.existsSync(sourcePath)) {
		console.error(`Error: Source file not found: ${sourcePath}`);
		process.exit(1);
	}
	return sourcePath;
}

/**
 * Output results based on options
 */
function outputResults(
	outputs: Parameters<typeof formatJsonOutput>[0],
	options: CliOptions,
	isDryRun: boolean
): void {
	if (options.json) {
		console.log(formatJsonOutput(outputs));
	} else if (!isDryRun) {
		// Summary is printed by core.ts for dry-run
		printSuccessOutput(outputs);
	}
}

program.parse();
