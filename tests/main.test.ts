import * as fs from 'node:fs';
import * as core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runSourceExecution } from '../src/execution';
import { getInputs } from '../src/inputs';
import type { ActionInputs, ActionOutputs, MultiRunResult } from '../src/types';

vi.mock('node:fs');
vi.mock('@actions/core', () => ({
	info: vi.fn(),
	setOutput: vi.fn(),
	setFailed: vi.fn(),
}));
vi.mock('../src/logger', () => ({
	setLogger: vi.fn(),
	createActionsLogger: vi.fn(() => ({
		info: vi.fn(),
		debug: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
	})),
	createConsoleLogger: vi.fn(() => ({
		info: vi.fn(),
		debug: vi.fn(),
		warning: vi.fn(),
		error: vi.fn(),
	})),
}));
vi.mock('../src/inputs', () => ({
	getInputs: vi.fn(),
}));
vi.mock('../src/execution', () => ({
	runSourceExecution: vi.fn(),
}));

const baseInputs: ActionInputs = {
	confluenceBaseUrl: 'https://example.atlassian.net',
	email: 'user@example.com',
	apiToken: 'token',
	source: 'docs/page.md',
	attachmentsBase: 'docs',
	frontmatterPageIdKey: 'confluence_page_id',
	imageMode: 'upload',
	downloadRemoteImages: false,
	mermaidMacro: 'mermaid',
	skipIfUnchanged: true,
	dryRun: false,
	exclude: [],
	notifyWatchers: false,
	userAgent: 'test-agent',
};

const singleOutputs: ActionOutputs = {
	pageUrl: 'https://example.atlassian.net/wiki/spaces/DOC/pages/123',
	pageId: '123',
	version: 5,
	updated: true,
	created: false,
	attachmentsUploaded: 2,
	contentHash: 'abc123',
};

const multiResult: MultiRunResult = {
	summary: {
		total: 3,
		succeeded: 2,
		failed: 1,
		skipped: 0,
		updated: 1,
		attachmentsUploaded: 4,
	},
	results: [
		{
			source: 'docs/a.md',
			pageUrl: 'https://example.atlassian.net/wiki/spaces/DOC/pages/1',
			pageId: '1',
			version: 2,
			updated: true,
			attachmentsUploaded: 4,
			contentHash: 'hash-a',
		},
		{
			source: 'docs/b.md',
			pageUrl: 'https://example.atlassian.net/wiki/spaces/DOC/pages/2',
			pageId: '2',
			version: 1,
			updated: false,
			attachmentsUploaded: 0,
			contentHash: 'hash-b',
		},
	],
	failures: [{ source: 'docs/c.md', error: 'boom' }],
	skipped: [],
};

async function runMain(): Promise<void> {
	vi.resetModules();
	await import('../src/main');
	// run() is fired at import time without being awaited; wait for it to settle.
	await vi.waitFor(() => {
		expect(
			vi.mocked(core.setOutput).mock.calls.length + vi.mocked(core.setFailed).mock.calls.length
		).toBeGreaterThan(0);
	});
}

describe('main.ts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(getInputs).mockReturnValue({ ...baseInputs });
	});

	describe('single mode', () => {
		it('should set every action output with stringified values', async () => {
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'single',
				result: { outputs: singleOutputs },
			});

			await runMain();

			expect(core.setOutput).toHaveBeenCalledWith(
				'page_url',
				'https://example.atlassian.net/wiki/spaces/DOC/pages/123'
			);
			expect(core.setOutput).toHaveBeenCalledWith('page_id', '123');
			expect(core.setOutput).toHaveBeenCalledWith('version', '5');
			expect(core.setOutput).toHaveBeenCalledWith('updated', 'true');
			expect(core.setOutput).toHaveBeenCalledWith('created', 'false');
			expect(core.setOutput).toHaveBeenCalledWith('attachments_uploaded', '2');
			expect(core.setOutput).toHaveBeenCalledWith('content_hash', 'abc123');
			expect(core.setOutput).toHaveBeenCalledTimes(7);
			expect(core.setFailed).not.toHaveBeenCalled();
		});

		it('should print a summary for non-dry-run', async () => {
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'single',
				result: { outputs: singleOutputs },
			});

			await runMain();

			expect(core.info).toHaveBeenCalledWith('=== Summary ===');
			expect(core.info).toHaveBeenCalledWith(
				'Page URL: https://example.atlassian.net/wiki/spaces/DOC/pages/123'
			);
			expect(core.info).toHaveBeenCalledWith('Version: 5');
		});

		it('should not print a summary for dry-run', async () => {
			vi.mocked(getInputs).mockReturnValue({ ...baseInputs, dryRun: true });
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'single',
				result: { outputs: singleOutputs },
			});

			await runMain();

			expect(core.setOutput).toHaveBeenCalledTimes(7);
			expect(core.info).not.toHaveBeenCalledWith('=== Summary ===');
		});
	});

	describe('multi mode', () => {
		it('should set aggregate outputs and blank out single-page outputs', async () => {
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'multi',
				result: multiResult,
			});

			await runMain();

			expect(core.setOutput).toHaveBeenCalledWith('page_url', '');
			expect(core.setOutput).toHaveBeenCalledWith('page_id', '');
			expect(core.setOutput).toHaveBeenCalledWith('version', '');
			expect(core.setOutput).toHaveBeenCalledWith('updated', '');
			expect(core.setOutput).toHaveBeenCalledWith('created', '');
			expect(core.setOutput).toHaveBeenCalledWith('attachments_uploaded', '');
			expect(core.setOutput).toHaveBeenCalledWith('content_hash', '');
			expect(core.setOutput).toHaveBeenCalledWith('total_files', '3');
			expect(core.setOutput).toHaveBeenCalledWith('succeeded_files', '2');
			expect(core.setOutput).toHaveBeenCalledWith('failed_files', '1');
			expect(core.setOutput).toHaveBeenCalledWith('updated_files', '1');
			expect(core.setOutput).toHaveBeenCalledWith('attachments_uploaded_total', '4');
			expect(core.setOutput).toHaveBeenCalledWith(
				'results_json',
				JSON.stringify(multiResult.results)
			);
			expect(core.setOutput).toHaveBeenCalledWith(
				'failures_json',
				JSON.stringify(multiResult.failures)
			);
			expect(core.setOutput).toHaveBeenCalledWith('skipped_files', '0');
			expect(core.setOutput).toHaveBeenCalledWith(
				'skipped_json',
				JSON.stringify(multiResult.skipped)
			);
			expect(core.setOutput).toHaveBeenCalledTimes(16);
		});

		it('should fail the action when some files failed', async () => {
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'multi',
				result: multiResult,
			});

			await runMain();

			expect(core.setFailed).toHaveBeenCalledWith(
				'1 file(s) failed during directory synchronization.'
			);
		});

		it('should not fail the action when all files succeed', async () => {
			vi.mocked(runSourceExecution).mockResolvedValue({
				mode: 'multi',
				result: {
					...multiResult,
					summary: { ...multiResult.summary, failed: 0 },
					failures: [],
				},
			});

			await runMain();

			expect(core.setFailed).not.toHaveBeenCalled();
		});
	});

	describe('error handling', () => {
		it('should fail when the source path does not exist', async () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			await runMain();

			expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining('Source path not found'));
			expect(core.setOutput).not.toHaveBeenCalled();
		});

		it('should fail with the error message when execution throws', async () => {
			vi.mocked(runSourceExecution).mockRejectedValue(new Error('API exploded'));

			await runMain();

			expect(core.setFailed).toHaveBeenCalledWith('API exploded');
			expect(core.setOutput).not.toHaveBeenCalled();
		});
	});
});
