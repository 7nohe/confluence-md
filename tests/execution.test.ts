import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveMarkdownFiles, runSourceExecution } from '../src/execution';
import type { ActionInputs } from '../src/types';

vi.mock('node:fs');
vi.mock('../src/core', () => ({
	runConversion: vi.fn(),
}));

import { runConversion } from '../src/core';

function createFileEntry(name: string) {
	return {
		name,
		isDirectory: () => false,
		isFile: () => true,
	};
}

function createDirectoryEntry(name: string) {
	return {
		name,
		isDirectory: () => true,
		isFile: () => false,
	};
}

describe('execution.ts', () => {
	const baseInputs: ActionInputs = {
		confluenceBaseUrl: 'https://example.atlassian.net',
		email: 'user@example.com',
		apiToken: 'token',
		source: 'docs',
		attachmentsBase: 'docs',
		attachmentsBaseProvided: false,
		pageId: '99999',
		frontmatterPageIdKey: 'confluence_page_id',
		imageMode: 'upload',
		downloadRemoteImages: false,
		skipIfUnchanged: true,
		dryRun: false,
		exclude: [],
		notifyWatchers: false,
		userAgent: 'test-agent',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('resolveMarkdownFiles', () => {
		it('should recursively collect markdown files in stable order', () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const guideDir = path.join(docsDir, 'guide');

			vi.mocked(fs.readdirSync).mockImplementation((dirPath) => {
				if (dirPath === docsDir) {
					return [createFileEntry('b.md'), createDirectoryEntry('guide'), createFileEntry('a.md')];
				}
				if (dirPath === guideDir) {
					return [createFileEntry('nested.md'), createFileEntry('note.txt')];
				}
				return [];
			});

			const files = resolveMarkdownFiles(docsDir);

			expect(files).toEqual([
				{ path: path.join(docsDir, 'a.md'), displayPath: 'docs/a.md' },
				{ path: path.join(docsDir, 'b.md'), displayPath: 'docs/b.md' },
				{ path: path.join(guideDir, 'nested.md'), displayPath: 'docs/guide/nested.md' },
			]);
		});

		it('should exclude files matching glob patterns', () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const guideDir = path.join(docsDir, 'guide');

			vi.mocked(fs.readdirSync).mockImplementation((dirPath) => {
				if (dirPath === docsDir) {
					return [
						createFileEntry('README.md'),
						createFileEntry('page.md'),
						createDirectoryEntry('guide'),
					];
				}
				if (dirPath === guideDir) {
					return [createFileEntry('nested.md')];
				}
				return [];
			});

			const files = resolveMarkdownFiles(docsDir, ['**/README.md']);

			expect(files.map((f) => f.displayPath)).toEqual(['docs/guide/nested.md', 'docs/page.md']);
		});

		it('should support multiple exclude patterns', () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const draftDir = path.join(docsDir, 'draft');

			vi.mocked(fs.readdirSync).mockImplementation((dirPath) => {
				if (dirPath === docsDir) {
					return [
						createFileEntry('README.md'),
						createFileEntry('page.md'),
						createDirectoryEntry('draft'),
					];
				}
				if (dirPath === draftDir) {
					return [createFileEntry('wip.md')];
				}
				return [];
			});

			const files = resolveMarkdownFiles(docsDir, ['**/README.md', 'draft/**']);

			expect(files.map((f) => f.displayPath)).toEqual(['docs/page.md']);
		});
	});

	describe('runSourceExecution', () => {
		it('should run a single markdown file as single mode', async () => {
			const filePath = path.join(process.cwd(), 'docs/page.md');
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => true,
				isDirectory: () => false,
			} as fs.Stats);
			vi.mocked(fs.readFileSync).mockReturnValue('---\nconfluence_page_id: 12345\n---\n\n# Test');
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 1,
					updated: true,
					created: false,
					attachmentsUploaded: 0,
					contentHash: 'abc123',
				},
			});

			const result = await runSourceExecution({
				...baseInputs,
				source: filePath,
			});

			expect(result.mode).toBe('single');
			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: filePath,
					attachmentsBase: path.dirname(filePath),
					titleOverride: undefined,
				}),
				markdownContent: '\n# Test',
				frontmatter: { confluence_page_id: 12345 },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should use frontmatter title for a single markdown file', async () => {
			const filePath = path.join(process.cwd(), 'docs/page.md');
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => true,
				isDirectory: () => false,
			} as fs.Stats);
			vi.mocked(fs.readFileSync).mockReturnValue(
				'---\nconfluence_page_id: 12345\ntitle: Frontmatter Title\n---\n\n# Test'
			);
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 1,
					updated: true,
					created: false,
					attachmentsUploaded: 0,
					contentHash: 'abc123',
				},
			});

			await runSourceExecution({
				...baseInputs,
				source: filePath,
			});

			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: filePath,
					titleOverride: 'Frontmatter Title',
				}),
				markdownContent: '\n# Test',
				frontmatter: { confluence_page_id: 12345, title: 'Frontmatter Title' },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should prefer explicit titleOverride over frontmatter title for a single file', async () => {
			const filePath = path.join(process.cwd(), 'docs/page.md');
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => true,
				isDirectory: () => false,
			} as fs.Stats);
			vi.mocked(fs.readFileSync).mockReturnValue(
				'---\nconfluence_page_id: 12345\ntitle: Frontmatter Title\n---\n\n# Test'
			);
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 1,
					updated: true,
					created: false,
					attachmentsUploaded: 0,
					contentHash: 'abc123',
				},
			});

			await runSourceExecution({
				...baseInputs,
				source: filePath,
				titleOverride: 'CLI Title',
			});

			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: filePath,
					titleOverride: 'CLI Title',
				}),
				markdownContent: '\n# Test',
				frontmatter: { confluence_page_id: 12345, title: 'Frontmatter Title' },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should process directory files and continue after failures', async () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const aPath = path.join(docsDir, 'a.md');
			const bPath = path.join(docsDir, 'b.md');

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => false,
				isDirectory: () => true,
			} as fs.Stats);
			vi.mocked(fs.readdirSync).mockImplementation((dirPath) => {
				if (dirPath === docsDir) {
					return [createFileEntry('b.md'), createFileEntry('a.md')];
				}
				return [];
			});
			vi.mocked(fs.readFileSync).mockImplementation((filePath) => {
				if (filePath === aPath) {
					return '---\nconfluence_page_id: 12345\n---\n\n# A';
				}
				if (filePath === bPath) {
					return '# Missing';
				}
				return '';
			});
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 2,
					updated: true,
					created: false,
					attachmentsUploaded: 1,
					contentHash: 'hash123',
				},
			});

			const result = await runSourceExecution(baseInputs);

			expect(result.mode).toBe('multi');
			if (result.mode !== 'multi') {
				throw new Error('Expected multi result');
			}

			expect(result.result.summary).toEqual({
				total: 2,
				succeeded: 1,
				failed: 0,
				skipped: 1,
				updated: 1,
				attachmentsUploaded: 1,
			});
			expect(result.result.results).toEqual([
				{
					source: 'docs/a.md',
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 2,
					updated: true,
					attachmentsUploaded: 1,
					contentHash: 'hash123',
				},
			]);
			expect(result.result.failures).toEqual([]);
			expect(result.result.skipped).toEqual([
				{
					source: 'docs/b.md',
					reason: expect.stringContaining('Page ID not found'),
				},
			]);
			expect(runConversion).toHaveBeenCalledTimes(1);
			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: aPath,
					attachmentsBase: docsDir,
					titleOverride: undefined,
				}),
				markdownContent: '\n# A',
				frontmatter: { confluence_page_id: 12345 },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should use frontmatter title when processing a directory', async () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const aPath = path.join(docsDir, 'a.md');

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => false,
				isDirectory: () => true,
			} as fs.Stats);
			vi.mocked(fs.readdirSync).mockReturnValue([createFileEntry('a.md')]);
			vi.mocked(fs.readFileSync).mockReturnValue(
				'---\nconfluence_page_id: 12345\ntitle: Directory Title\n---\n\n# A'
			);
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 2,
					updated: true,
					created: false,
					attachmentsUploaded: 1,
					contentHash: 'hash123',
				},
			});

			await runSourceExecution(baseInputs);

			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: aPath,
					titleOverride: 'Directory Title',
				}),
				markdownContent: '\n# A',
				frontmatter: { confluence_page_id: 12345, title: 'Directory Title' },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should ignore titleOverride when processing a directory', async () => {
			const docsDir = path.join(process.cwd(), 'docs');
			const aPath = path.join(docsDir, 'a.md');

			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => false,
				isDirectory: () => true,
			} as fs.Stats);
			vi.mocked(fs.readdirSync).mockReturnValue([createFileEntry('a.md')]);
			vi.mocked(fs.readFileSync).mockReturnValue(
				'---\nconfluence_page_id: 12345\ntitle: Frontmatter Title\n---\n\n# A'
			);
			vi.mocked(runConversion).mockResolvedValue({
				outputs: {
					pageUrl: 'https://example.atlassian.net/wiki/pages/12345',
					pageId: '12345',
					version: 2,
					updated: true,
					created: false,
					attachmentsUploaded: 1,
					contentHash: 'hash123',
				},
			});

			await runSourceExecution({
				...baseInputs,
				titleOverride: 'Batch Title',
			});

			expect(runConversion).toHaveBeenCalledWith({
				inputs: expect.objectContaining({
					source: aPath,
					titleOverride: 'Frontmatter Title',
				}),
				markdownContent: '\n# A',
				frontmatter: { confluence_page_id: 12345, title: 'Frontmatter Title' },
				pageTarget: { mode: 'update', pageId: '12345' },
			});
		});

		it('should throw when directory contains no markdown files', async () => {
			const docsDir = path.join(process.cwd(), 'docs');
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.statSync).mockReturnValue({
				isFile: () => false,
				isDirectory: () => true,
			} as fs.Stats);
			vi.mocked(fs.readdirSync).mockReturnValue([createFileEntry('note.txt')]);

			await expect(runSourceExecution(baseInputs)).rejects.toThrow(
				`No Markdown files found in directory: ${docsDir}`
			);
		});
	});
});
