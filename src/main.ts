/**
 * Main entry point for the confluence-md GitHub Action
 */

import * as fs from 'node:fs';
import * as core from '@actions/core';
import { runConversion } from './core';
import { extractFrontmatter, getPageIdFromFrontmatter } from './frontmatter';
import { getInputs, validateInputs } from './inputs';
import { createActionsLogger, setLogger } from './logger';

async function run(): Promise<void> {
	try {
		// Initialize logger for GitHub Actions
		setLogger(createActionsLogger());

		// Step 1: Get and validate inputs
		core.info('Reading inputs...');
		const inputs = getInputs();

		// Step 2: Read Markdown file
		core.info(`Reading Markdown file: ${inputs.source}`);
		if (!fs.existsSync(inputs.source)) {
			throw new Error(`Source file not found: ${inputs.source}`);
		}
		const markdown = fs.readFileSync(inputs.source, 'utf-8');

		// Step 3: Extract frontmatter and get page ID
		core.info('Extracting frontmatter...');
		const { data: frontmatter, content: markdownBody } = extractFrontmatter(markdown);
		const frontmatterPageId = getPageIdFromFrontmatter(frontmatter, inputs.frontmatterPageIdKey);
		const pageId = validateInputs(inputs, frontmatterPageId);

		// Step 4: Run conversion and update
		const result = await runConversion({
			inputs,
			markdownContent: markdownBody,
			pageId,
		});

		// Step 5: Set outputs
		core.setOutput('page_url', result.outputs.pageUrl);
		core.setOutput('page_id', result.outputs.pageId);
		core.setOutput('version', result.outputs.version.toString());
		core.setOutput('updated', result.outputs.updated.toString());
		core.setOutput('attachments_uploaded', result.outputs.attachmentsUploaded.toString());
		core.setOutput('content_hash', result.outputs.contentHash);

		// Summary (only for non-dry-run, as dry-run prints its own summary)
		if (!inputs.dryRun) {
			core.info('');
			core.info('=== Summary ===');
			core.info(`Page URL: ${result.outputs.pageUrl}`);
			core.info(`Page ID: ${result.outputs.pageId}`);
			core.info(`Version: ${result.outputs.version}`);
			core.info(`Updated: ${result.outputs.updated}`);
			core.info(`Attachments uploaded: ${result.outputs.attachmentsUploaded}`);
			core.info(`Content hash: ${result.outputs.contentHash}`);
		}
	} catch (error) {
		if (error instanceof Error) {
			core.setFailed(error.message);
		} else {
			core.setFailed('An unexpected error occurred');
		}
	}
}

run();
