/**
 * Core business logic for confluence-md
 * This module is shared between GitHub Actions and CLI entry points
 */

import * as crypto from 'node:crypto';
import { uploadAttachments } from './confluence/attachments';
import { ConfluenceClient } from './confluence/client';
import { buildPageUrl, getPage, updatePage } from './confluence/pages';
import { convertMarkdown } from './converter';
import { getLogger } from './logger';
import type { ActionInputs, ActionOutputs } from './types';

export interface RunOptions {
	inputs: ActionInputs;
	markdownContent: string;
	pageId: string;
}

export interface RunResult {
	outputs: ActionOutputs;
	storage?: string;
	imagesCount?: number;
}

/**
 * Run the markdown to confluence conversion and update
 */
export async function runConversion(options: RunOptions): Promise<RunResult> {
	const logger = getLogger();
	const { inputs, markdownContent, pageId } = options;

	logger.info(`Target page ID: ${pageId}`);

	// Step 1: Convert Markdown to Confluence storage format
	logger.info('Converting Markdown to Confluence storage format...');
	const { storage, images } = convertMarkdown(markdownContent, {
		attachmentsBase: inputs.attachmentsBase,
		imageMode: inputs.imageMode,
		downloadRemoteImages: inputs.downloadRemoteImages,
	});

	// Compute content hash
	const contentHash = crypto.createHash('sha256').update(storage).digest('hex').substring(0, 16);
	logger.info(`Content hash: ${contentHash}`);

	// Step 2: Handle dry run mode (skip API calls entirely)
	if (inputs.dryRun) {
		logger.info('Dry run mode - skipping API calls.');
		logger.info('Generated storage format:');
		logger.info(storage);

		const outputs: ActionOutputs = {
			pageUrl: `${inputs.confluenceBaseUrl}/wiki/spaces/~/pages/${pageId}`,
			pageId,
			version: 0,
			updated: false,
			attachmentsUploaded: 0,
			contentHash,
		};

		logger.info('');
		logger.info('=== Summary (Dry Run) ===');
		logger.info(`Page ID: ${outputs.pageId}`);
		logger.info(`Content hash: ${outputs.contentHash}`);
		logger.info(`Images found: ${images.length}`);

		return {
			outputs,
			storage,
			imagesCount: images.length,
		};
	}

	// Step 3: Create Confluence client
	const client = new ConfluenceClient({
		baseUrl: inputs.confluenceBaseUrl,
		email: inputs.email,
		apiToken: inputs.apiToken,
		userAgent: inputs.userAgent,
	});

	// Step 4: Fetch current page
	logger.info('Fetching current page...');
	const currentPage = await getPage(client, pageId);
	const currentVersion = currentPage.version.number;
	const title = inputs.titleOverride || currentPage.title;
	const titleChanged = title !== currentPage.title;

	// Step 5: Check if update is needed
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
		// Step 6: Upload attachments
		if (images.length > 0) {
			logger.info(`Uploading ${images.length} image(s)...`);
			attachmentsUploaded = await uploadAttachments(client, pageId, images, inputs.attachmentsBase);
			logger.info(`Uploaded ${attachmentsUploaded} attachment(s).`);
		}

		// Step 7: Update page
		const versionMessage = `Updated by confluence-md (hash: ${contentHash})`;
		await updatePage(client, pageId, title, storage, currentVersion, versionMessage);
	}

	// Step 8: Build outputs
	const pageUrl = buildPageUrl(inputs.confluenceBaseUrl, currentPage);
	const finalVersion = updated ? currentVersion + 1 : currentVersion;

	const outputs: ActionOutputs = {
		pageUrl,
		pageId,
		version: finalVersion,
		updated,
		attachmentsUploaded,
		contentHash,
	};

	return {
		outputs,
		imagesCount: images.length,
	};
}
