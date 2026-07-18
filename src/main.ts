/**
 * Main entry point for the confluence-md GitHub Action
 */

import * as fs from 'node:fs';
import * as core from '@actions/core';
import { runSourceExecution } from './execution';
import { getInputs } from './inputs';
import { createActionsLogger, setLogger } from './logger';

function setOutputs(values: Record<string, string | number | boolean>): void {
	for (const [name, value] of Object.entries(values)) {
		core.setOutput(name, typeof value === 'string' ? value : value.toString());
	}
}

function printSummary(entries: Record<string, string | number | boolean>): void {
	core.info('');
	core.info('=== Summary ===');
	for (const [label, value] of Object.entries(entries)) {
		core.info(`${label}: ${value}`);
	}
}

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
			const { outputs } = execution.result;
			setOutputs({
				page_url: outputs.pageUrl,
				page_id: outputs.pageId,
				version: outputs.version,
				updated: outputs.updated,
				created: outputs.created,
				attachments_uploaded: outputs.attachmentsUploaded,
				content_hash: outputs.contentHash,
			});

			// Summary (only for non-dry-run, as dry-run prints its own summary)
			if (!inputs.dryRun) {
				printSummary({
					'Page URL': outputs.pageUrl,
					'Page ID': outputs.pageId,
					Version: outputs.version,
					Updated: outputs.updated,
					Created: outputs.created,
					'Attachments uploaded': outputs.attachmentsUploaded,
					'Content hash': outputs.contentHash,
				});
			}
			return;
		}

		const { summary, results, failures, skipped } = execution.result;
		setOutputs({
			page_url: '',
			page_id: '',
			version: '',
			updated: '',
			created: '',
			attachments_uploaded: '',
			content_hash: '',
			total_files: summary.total,
			succeeded_files: summary.succeeded,
			failed_files: summary.failed,
			updated_files: summary.updated,
			attachments_uploaded_total: summary.attachmentsUploaded,
			results_json: JSON.stringify(results),
			failures_json: JSON.stringify(failures),
			skipped_files: summary.skipped,
			skipped_json: JSON.stringify(skipped),
		});

		printSummary({
			'Total files': summary.total,
			Succeeded: summary.succeeded,
			Failed: summary.failed,
			Skipped: summary.skipped,
			Updated: summary.updated,
			'Attachments uploaded': summary.attachmentsUploaded,
		});

		if (failures.length > 0) {
			core.setFailed(`${failures.length} file(s) failed during directory synchronization.`);
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
