/**
 * Core business logic for confluence-md
 * This module is shared between GitHub Actions and CLI entry points
 */

import * as crypto from 'node:crypto';
import * as path from 'node:path';
import { uploadAttachments } from './confluence/attachments';
import { ConfluenceClient } from './confluence/client';
import { buildPageUrl, createPage, getPage, resolveSpaceId, updatePage } from './confluence/pages';
import { convertMarkdown } from './converter';
import { extractFirstH1, getTitleFromFrontmatter } from './frontmatter';
import { getLogger } from './logger';
import type { ActionInputs, ActionOutputs, ImageReference, PageTarget } from './types';

export interface RunOptions {
	inputs: ActionInputs;
	markdownContent: string;
	frontmatter: Record<string, unknown>;
	pageTarget: PageTarget;
}

export interface RunResult {
	outputs: ActionOutputs;
	storage?: string;
	imagesCount?: number;
}

interface ConversionContext {
	client: ConfluenceClient;
	inputs: ActionInputs;
	storage: string;
	images: ImageReference[];
	contentHash: string;
}

/**
 * Priority: titleOverride > frontmatter title > first H1 > filename (without extension)
 */
function resolveTitle(
	inputs: ActionInputs,
	frontmatter: Record<string, unknown>,
	markdownContent: string
): string {
	if (inputs.titleOverride) {
		return inputs.titleOverride;
	}
	const fmTitle = getTitleFromFrontmatter(frontmatter);
	if (fmTitle) {
		return fmTitle;
	}
	const h1Title = extractFirstH1(markdownContent);
	if (h1Title) {
		return h1Title;
	}
	return path.basename(inputs.source, path.extname(inputs.source));
}

async function uploadImagesIfAny(
	client: ConfluenceClient,
	pageId: string,
	images: ImageReference[],
	attachmentsBase: string
): Promise<number> {
	if (images.length === 0) return 0;
	const logger = getLogger();
	logger.info(`Uploading ${images.length} image(s)...`);
	const count = await uploadAttachments(client, pageId, images, attachmentsBase);
	logger.info(`Uploaded ${count} attachment(s).`);
	return count;
}

/**
 * Run the markdown to confluence conversion and update
 */
export async function runConversion(options: RunOptions): Promise<RunResult> {
	const logger = getLogger();
	const { inputs, markdownContent, frontmatter, pageTarget } = options;

	if (pageTarget.mode === 'update') {
		logger.info(`Target page ID: ${pageTarget.pageId}`);
	} else {
		logger.info(`Target space: ${pageTarget.spaceKey} (create mode)`);
	}

	logger.info('Converting Markdown to Confluence storage format...');
	const { storage, images } = convertMarkdown(markdownContent, {
		attachmentsBase: inputs.attachmentsBase,
		imageMode: inputs.imageMode,
		downloadRemoteImages: inputs.downloadRemoteImages,
	});

	const contentHash = crypto.createHash('sha256').update(storage).digest('hex').substring(0, 16);
	logger.info(`Content hash: ${contentHash}`);

	if (inputs.dryRun) {
		logger.info('Dry run mode - skipping API calls.');
		logger.info('Generated storage format:');
		logger.info(storage);

		const pageId = pageTarget.mode === 'update' ? pageTarget.pageId : 'NEW';
		const created = pageTarget.mode === 'create';

		const outputs: ActionOutputs = {
			pageUrl: `${inputs.confluenceBaseUrl}/wiki/spaces/~/pages/${pageId}`,
			pageId,
			version: 0,
			updated: false,
			created,
			attachmentsUploaded: 0,
			contentHash,
		};

		logger.info('');
		logger.info('=== Summary (Dry Run) ===');
		logger.info(`Mode: ${pageTarget.mode}`);
		logger.info(`Page ID: ${outputs.pageId}`);
		logger.info(`Content hash: ${outputs.contentHash}`);
		logger.info(`Images found: ${images.length}`);
		if (created) {
			logger.info(`Would create page in space: ${pageTarget.spaceKey}`);
		}

		return {
			outputs,
			storage,
			imagesCount: images.length,
		};
	}

	const client = new ConfluenceClient({
		baseUrl: inputs.confluenceBaseUrl,
		email: inputs.email,
		apiToken: inputs.apiToken,
		userAgent: inputs.userAgent,
	});

	const ctx: ConversionContext = { client, inputs, storage, images, contentHash };

	if (pageTarget.mode === 'create') {
		return runCreateMode(ctx, frontmatter, markdownContent, pageTarget);
	}

	return runUpdateMode(ctx, pageTarget.pageId);
}

async function runCreateMode(
	ctx: ConversionContext,
	frontmatter: Record<string, unknown>,
	markdownContent: string,
	pageTarget: { mode: 'create'; spaceKey: string; parentPageId?: string }
): Promise<RunResult> {
	const logger = getLogger();
	const { client, inputs, storage, images, contentHash } = ctx;

	const title = resolveTitle(inputs, frontmatter, markdownContent);
	logger.info(`Page title: ${title}`);

	const spaceId = await resolveSpaceId(client, pageTarget.spaceKey);
	const createdPage = await createPage(client, title, spaceId, storage, pageTarget.parentPageId);
	const attachmentsUploaded = await uploadImagesIfAny(
		client,
		createdPage.id,
		images,
		inputs.attachmentsBase
	);

	const outputs: ActionOutputs = {
		pageUrl: buildPageUrl(inputs.confluenceBaseUrl, createdPage),
		pageId: createdPage.id,
		version: createdPage.version.number,
		updated: false,
		created: true,
		attachmentsUploaded,
		contentHash,
	};

	return { outputs, imagesCount: images.length };
}

async function runUpdateMode(ctx: ConversionContext, pageId: string): Promise<RunResult> {
	const logger = getLogger();
	const { client, inputs, storage, images, contentHash } = ctx;

	logger.info('Fetching current page...');
	const currentPage = await getPage(client, pageId);
	const currentVersion = currentPage.version.number;
	const title = inputs.titleOverride || currentPage.title;
	const titleChanged = title !== currentPage.title;

	let updated = false;
	let attachmentsUploaded = 0;

	if (inputs.skipIfUnchanged) {
		const currentStorage = currentPage.body?.storage?.value || '';
		if (currentStorage === storage && !titleChanged) {
			logger.info('Content unchanged, skipping update.');
		} else {
			updated = true;
		}
	} else {
		updated = true;
	}

	if (updated) {
		attachmentsUploaded = await uploadImagesIfAny(client, pageId, images, inputs.attachmentsBase);
		const versionMessage = `Updated by confluence-md (hash: ${contentHash})`;
		await updatePage(client, pageId, title, storage, currentVersion, versionMessage);
	}

	const pageUrl = buildPageUrl(inputs.confluenceBaseUrl, currentPage);
	const finalVersion = updated ? currentVersion + 1 : currentVersion;

	const outputs: ActionOutputs = {
		pageUrl,
		pageId,
		version: finalVersion,
		updated,
		created: false,
		attachmentsUploaded,
		contentHash,
	};

	return { outputs, imagesCount: images.length };
}
