/**
 * Output formatting for CLI
 */

import type { ActionOutputs, MultiRunResult } from '../types';

/**
 * Format outputs as JSON
 */
export function formatJsonOutput(outputs: ActionOutputs): string {
	return JSON.stringify(
		{
			pageUrl: outputs.pageUrl,
			pageId: outputs.pageId,
			version: outputs.version,
			updated: outputs.updated,
			attachmentsUploaded: outputs.attachmentsUploaded,
			contentHash: outputs.contentHash,
		},
		null,
		2
	);
}

export function formatMultiRunJsonOutput(result: MultiRunResult): string {
	return JSON.stringify(
		{
			mode: 'multi',
			summary: result.summary,
			results: result.results,
			failures: result.failures,
		},
		null,
		2
	);
}

/**
 * Print success output to console
 */
export function printSuccessOutput(outputs: ActionOutputs): void {
	console.log('');
	console.log('=== Result ===');
	console.log(`Page URL: ${outputs.pageUrl}`);
	console.log(`Page ID: ${outputs.pageId}`);
	console.log(`Version: ${outputs.version}`);
	console.log(`Updated: ${outputs.updated}`);
	console.log(`Attachments uploaded: ${outputs.attachmentsUploaded}`);
}

export function printMultiRunOutput(result: MultiRunResult): void {
	console.log('');
	console.log('=== Summary ===');
	console.log(`Total files: ${result.summary.total}`);
	console.log(`Succeeded: ${result.summary.succeeded}`);
	console.log(`Failed: ${result.summary.failed}`);
	console.log(`Updated: ${result.summary.updated}`);
	console.log(`Attachments uploaded: ${result.summary.attachmentsUploaded}`);

	if (result.results.length > 0) {
		console.log('');
		console.log('=== Results ===');
		for (const item of result.results) {
			console.log(`${item.source} -> ${item.pageId} (updated: ${item.updated})`);
		}
	}

	if (result.failures.length > 0) {
		console.log('');
		console.log('=== Failures ===');
		for (const failure of result.failures) {
			console.log(`${failure.source}: ${failure.error}`);
		}
	}
}

/**
 * Format an error for output
 */
export function formatError(error: unknown, asJson: boolean): string {
	const message = error instanceof Error ? error.message : 'Unknown error';
	if (asJson) {
		return JSON.stringify({ error: message });
	}
	return `Error: ${message}`;
}
