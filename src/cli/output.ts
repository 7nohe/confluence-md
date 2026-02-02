/**
 * Output formatting for CLI
 */

import type { ActionOutputs } from '../types';

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
