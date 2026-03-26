/**
 * Main entry point for the confluence-md GitHub Action
 */

import * as fs from 'node:fs';
import * as core from '@actions/core';
import { runSourceExecution } from './execution';
import { getInputs } from './inputs';
import { createActionsLogger, setLogger } from './logger';

async function run(): Promise<void> {
	try {
		// Initialize logger for GitHub Actions
		setLogger(createActionsLogger());

		// Step 1: Get and validate inputs
		core.info('Reading inputs...');
		const inputs = getInputs();

		// Step 2: Read Markdown file
		core.info(`Reading Markdown source: ${inputs.source}`);
		if (!fs.existsSync(inputs.source)) {
			throw new Error(`Source path not found: ${inputs.source}`);
		}

		// Step 3: Run conversion and update
		const execution = await runSourceExecution(inputs);

		// Step 4: Set outputs
		if (execution.mode === 'single') {
			core.setOutput('page_url', execution.result.outputs.pageUrl);
			core.setOutput('page_id', execution.result.outputs.pageId);
			core.setOutput('version', execution.result.outputs.version.toString());
			core.setOutput('updated', execution.result.outputs.updated.toString());
			core.setOutput('created', execution.result.outputs.created.toString());
			core.setOutput(
				'attachments_uploaded',
				execution.result.outputs.attachmentsUploaded.toString()
			);
			core.setOutput('content_hash', execution.result.outputs.contentHash);

			// Summary (only for non-dry-run, as dry-run prints its own summary)
			if (!inputs.dryRun) {
				core.info('');
				core.info('=== Summary ===');
				core.info(`Page URL: ${execution.result.outputs.pageUrl}`);
				core.info(`Page ID: ${execution.result.outputs.pageId}`);
				core.info(`Version: ${execution.result.outputs.version}`);
				core.info(`Updated: ${execution.result.outputs.updated}`);
				core.info(`Created: ${execution.result.outputs.created}`);
				core.info(`Attachments uploaded: ${execution.result.outputs.attachmentsUploaded}`);
				core.info(`Content hash: ${execution.result.outputs.contentHash}`);
			}
			return;
		}

		core.setOutput('page_url', '');
		core.setOutput('page_id', '');
		core.setOutput('version', '');
		core.setOutput('updated', '');
		core.setOutput('created', '');
		core.setOutput('attachments_uploaded', '');
		core.setOutput('content_hash', '');
		core.setOutput('total_files', execution.result.summary.total.toString());
		core.setOutput('succeeded_files', execution.result.summary.succeeded.toString());
		core.setOutput('failed_files', execution.result.summary.failed.toString());
		core.setOutput('updated_files', execution.result.summary.updated.toString());
		core.setOutput(
			'attachments_uploaded_total',
			execution.result.summary.attachmentsUploaded.toString()
		);
		core.setOutput('results_json', JSON.stringify(execution.result.results));
		core.setOutput('failures_json', JSON.stringify(execution.result.failures));
		core.setOutput('skipped_files', execution.result.summary.skipped.toString());
		core.setOutput('skipped_json', JSON.stringify(execution.result.skipped));

		core.info('');
		core.info('=== Summary ===');
		core.info(`Total files: ${execution.result.summary.total}`);
		core.info(`Succeeded: ${execution.result.summary.succeeded}`);
		core.info(`Failed: ${execution.result.summary.failed}`);
		core.info(`Skipped: ${execution.result.summary.skipped}`);
		core.info(`Updated: ${execution.result.summary.updated}`);
		core.info(`Attachments uploaded: ${execution.result.summary.attachmentsUploaded}`);

		if (execution.result.failures.length > 0) {
			core.setFailed(
				`${execution.result.failures.length} file(s) failed during directory synchronization.`
			);
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
