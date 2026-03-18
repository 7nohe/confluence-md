import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	formatError,
	formatJsonOutput,
	formatMultiRunJsonOutput,
	printMultiRunOutput,
	printSuccessOutput,
} from '../../src/cli/output';
import type { ActionOutputs, MultiRunResult } from '../../src/types';

describe('cli/output.ts', () => {
	describe('formatJsonOutput', () => {
		it('should format outputs as JSON', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
				pageId: '12345',
				version: 5,
				updated: true,
				attachmentsUploaded: 3,
				contentHash: 'abc123',
				created: false,
			};

			const result = formatJsonOutput(outputs);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual({
				pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
				pageId: '12345',
				version: 5,
				updated: true,
				created: false,
				attachmentsUploaded: 3,
				contentHash: 'abc123',
			});
		});

		it('should include created in output', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
				pageId: '12345',
				version: 1,
				updated: false,
				attachmentsUploaded: 0,
				contentHash: 'xyz789',
				created: false,
			};

			const result = formatJsonOutput(outputs);
			const parsed = JSON.parse(result);

			expect(parsed).toHaveProperty('created', false);
		});

		it('should format with indentation', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/1',
				pageId: '1',
				version: 1,
				updated: true,
				attachmentsUploaded: 0,
				contentHash: 'hash',
				created: false,
			};

			const result = formatJsonOutput(outputs);
			// Should be pretty-printed with 2-space indentation
			expect(result).toContain('\n');
			expect(result).toContain('  "pageUrl"');
		});

		it('should handle zero values', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/0',
				pageId: '0',
				version: 0,
				updated: false,
				attachmentsUploaded: 0,
				contentHash: '',
				created: false,
			};

			const result = formatJsonOutput(outputs);
			const parsed = JSON.parse(result);

			expect(parsed.version).toBe(0);
			expect(parsed.attachmentsUploaded).toBe(0);
			expect(parsed.updated).toBe(false);
		});
	});

	describe('formatError', () => {
		it('should format Error object as text', () => {
			const error = new Error('Something went wrong');
			const result = formatError(error, false);
			expect(result).toBe('Error: Something went wrong');
		});

		it('should format Error object as JSON', () => {
			const error = new Error('Something went wrong');
			const result = formatError(error, true);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ error: 'Something went wrong' });
		});

		it('should handle non-Error objects as text', () => {
			const result = formatError('string error', false);
			expect(result).toBe('Error: Unknown error');
		});

		it('should handle non-Error objects as JSON', () => {
			const result = formatError({ custom: 'error' }, true);
			const parsed = JSON.parse(result);
			expect(parsed).toEqual({ error: 'Unknown error' });
		});

		it('should handle null/undefined', () => {
			expect(formatError(null, false)).toBe('Error: Unknown error');
			expect(formatError(undefined, false)).toBe('Error: Unknown error');
		});
	});

	describe('formatMultiRunJsonOutput', () => {
		it('should format multi-run results as JSON', () => {
			const result: MultiRunResult = {
				summary: {
					total: 2,
					succeeded: 1,
					failed: 1,
					skipped: 0,
					updated: 1,
					attachmentsUploaded: 3,
				},
				results: [
					{
						source: 'docs/a.md',
						pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
						pageId: '12345',
						version: 2,
						updated: true,
						attachmentsUploaded: 3,
						contentHash: 'abc123',
					},
				],
				failures: [{ source: 'docs/b.md', error: 'Missing frontmatter page ID' }],
				skipped: [],
			};

			const parsed = JSON.parse(formatMultiRunJsonOutput(result));

			expect(parsed.mode).toBe('multi');
			expect(parsed.summary).toEqual(result.summary);
			expect(parsed.results).toEqual(result.results);
			expect(parsed.failures).toEqual(result.failures);
		});
	});

	describe('printSuccessOutput', () => {
		let consoleSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		it('should print all output fields', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
				pageId: '12345',
				version: 10,
				updated: true,
				attachmentsUploaded: 5,
				contentHash: 'hash123',
				created: false,
			};

			printSuccessOutput(outputs);

			expect(consoleSpy).toHaveBeenCalledWith('');
			expect(consoleSpy).toHaveBeenCalledWith('=== Result ===');
			expect(consoleSpy).toHaveBeenCalledWith(
				'Page URL: https://example.atlassian.net/wiki/pages/12345'
			);
			expect(consoleSpy).toHaveBeenCalledWith('Page ID: 12345');
			expect(consoleSpy).toHaveBeenCalledWith('Version: 10');
			expect(consoleSpy).toHaveBeenCalledWith('Updated: true');
			expect(consoleSpy).toHaveBeenCalledWith('Created: false');
			expect(consoleSpy).toHaveBeenCalledWith('Attachments uploaded: 5');
		});

		it('should print created field', () => {
			const outputs: ActionOutputs = {
				pageUrl: 'https://example.atlassian.net/wiki/pages/1',
				pageId: '1',
				version: 1,
				updated: false,
				attachmentsUploaded: 0,
				contentHash: 'hash',
				created: false,
			};

			printSuccessOutput(outputs);

			expect(consoleSpy).toHaveBeenCalledWith('Created: false');
		});
	});

	describe('printMultiRunOutput', () => {
		let consoleSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleSpy.mockRestore();
		});

		it('should print summary, results, and failures', () => {
			const result: MultiRunResult = {
				summary: {
					total: 2,
					succeeded: 1,
					failed: 1,
					skipped: 0,
					updated: 1,
					attachmentsUploaded: 2,
				},
				results: [
					{
						source: 'docs/a.md',
						pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
						pageId: '12345',
						version: 2,
						updated: true,
						attachmentsUploaded: 2,
						contentHash: 'abc123',
					},
				],
				failures: [{ source: 'docs/b.md', error: 'boom' }],
				skipped: [],
			};

			printMultiRunOutput(result);

			expect(consoleSpy).toHaveBeenCalledWith('=== Summary ===');
			expect(consoleSpy).toHaveBeenCalledWith('Total files: 2');
			expect(consoleSpy).toHaveBeenCalledWith('=== Results ===');
			expect(consoleSpy).toHaveBeenCalledWith('docs/a.md -> 12345 (updated: true)');
			expect(consoleSpy).toHaveBeenCalledWith('=== Failures ===');
			expect(consoleSpy).toHaveBeenCalledWith('docs/b.md: boom');
		});
	});
});
