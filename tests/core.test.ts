import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runConversion } from '../src/core';
import type { ActionInputs } from '../src/types';

// Mock confluence modules
vi.mock('../src/confluence/client', () => ({
	ConfluenceClient: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		put: vi.fn(),
		postMultipart: vi.fn(),
	})),
}));

vi.mock('../src/confluence/pages', () => ({
	getPage: vi.fn(),
	updatePage: vi.fn(),
	buildPageUrl: vi.fn(),
}));

vi.mock('../src/confluence/attachments', () => ({
	uploadAttachments: vi.fn(),
}));

import { uploadAttachments } from '../src/confluence/attachments';
// Import mocked modules
import { ConfluenceClient } from '../src/confluence/client';
import { buildPageUrl, getPage, updatePage } from '../src/confluence/pages';

describe('core.ts', () => {
	const baseInputs: ActionInputs = {
		confluenceBaseUrl: 'https://example.atlassian.net',
		email: 'user@example.com',
		apiToken: 'token',
		source: 'test.md',
		attachmentsBase: '.',
		frontmatterPageIdKey: 'confluence_page_id',
		imageMode: 'upload',
		downloadRemoteImages: false,
		skipIfUnchanged: true,
		dryRun: false,
		notifyWatchers: false,
		userAgent: 'test-agent',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('runConversion', () => {
		describe('dry run mode', () => {
			it('should skip API calls in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(ConfluenceClient).not.toHaveBeenCalled();
				expect(getPage).not.toHaveBeenCalled();
				expect(updatePage).not.toHaveBeenCalled();
				expect(result.outputs.updated).toBe(false);
				expect(result.outputs.version).toBe(0);
			});

			it('should return storage content in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(result.storage).toBeDefined();
				expect(result.storage).toContain('<h1>Test</h1>');
			});

			it('should return correct page URL format in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(result.outputs.pageUrl).toBe(
					'https://example.atlassian.net/wiki/spaces/~/pages/12345'
				);
				expect(result.outputs.pageId).toBe('12345');
			});

			it('should compute content hash in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(result.outputs.contentHash).toBeDefined();
				expect(result.outputs.contentHash).toHaveLength(16);
			});

			it('should count images in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test\n\n![alt](image.png)',
					pageId: '12345',
				});

				expect(result.imagesCount).toBe(1);
			});
		});

		describe('normal mode', () => {
			beforeEach(() => {
				vi.mocked(getPage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 1 },
					body: { storage: { value: '<p>old content</p>', representation: 'storage' } },
					_links: { webui: '/spaces/TEST/pages/12345' },
				});
				vi.mocked(updatePage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 2 },
				});
				vi.mocked(buildPageUrl).mockReturnValue(
					'https://example.atlassian.net/wiki/spaces/TEST/pages/12345'
				);
				vi.mocked(uploadAttachments).mockResolvedValue(0);
			});

			it('should create ConfluenceClient with correct options', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(ConfluenceClient).toHaveBeenCalledWith({
					baseUrl: 'https://example.atlassian.net',
					email: 'user@example.com',
					apiToken: 'token',
					userAgent: 'test-agent',
				});
			});

			it('should fetch current page', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(getPage).toHaveBeenCalledWith(expect.anything(), '12345');
			});

			it('should update page when content differs', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# New Content',
					pageId: '12345',
				});

				expect(updatePage).toHaveBeenCalled();
			});

			it('should skip update when content is unchanged and skipIfUnchanged is true', async () => {
				vi.mocked(getPage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 1 },
					body: { storage: { value: '<h1>Test</h1>', representation: 'storage' } },
				});

				const result = await runConversion({
					inputs: { ...baseInputs, skipIfUnchanged: true },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(updatePage).not.toHaveBeenCalled();
				expect(result.outputs.updated).toBe(false);
			});

			it('should update when title changes even if content is unchanged', async () => {
				vi.mocked(getPage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 1 },
					body: { storage: { value: '<h1>Test</h1>', representation: 'storage' } },
				});

				const result = await runConversion({
					inputs: {
						...baseInputs,
						skipIfUnchanged: true,
						titleOverride: 'Renamed Page',
					},
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(updatePage).toHaveBeenCalledWith(
					expect.anything(),
					'12345',
					'Renamed Page',
					expect.any(String),
					1,
					expect.any(String)
				);
				expect(result.outputs.updated).toBe(true);
			});

			it('should update even when content unchanged if skipIfUnchanged is false', async () => {
				vi.mocked(getPage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 1 },
					body: { storage: { value: '<h1>Test</h1>', representation: 'storage' } },
				});

				const result = await runConversion({
					inputs: { ...baseInputs, skipIfUnchanged: false },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(updatePage).toHaveBeenCalled();
				expect(result.outputs.updated).toBe(true);
			});

			it('should upload attachments when images are present', async () => {
				vi.mocked(uploadAttachments).mockResolvedValue(2);

				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test\n\n![img1](a.png)\n![img2](b.png)',
					pageId: '12345',
				});

				expect(uploadAttachments).toHaveBeenCalled();
				expect(result.outputs.attachmentsUploaded).toBe(2);
			});

			it('should use titleOverride when provided', async () => {
				await runConversion({
					inputs: { ...baseInputs, titleOverride: 'Custom Title' },
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(updatePage).toHaveBeenCalledWith(
					expect.anything(),
					'12345',
					'Custom Title',
					expect.any(String),
					1,
					expect.any(String)
				);
			});

			it('should use page title when titleOverride not provided', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(updatePage).toHaveBeenCalledWith(
					expect.anything(),
					'12345',
					'Test Page',
					expect.any(String),
					1,
					expect.any(String)
				);
			});

			it('should return correct outputs', async () => {
				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(result.outputs.pageUrl).toBe(
					'https://example.atlassian.net/wiki/spaces/TEST/pages/12345'
				);
				expect(result.outputs.pageId).toBe('12345');
				expect(result.outputs.version).toBe(2);
				expect(result.outputs.updated).toBe(true);
				expect(result.outputs.contentHash).toBeDefined();
			});

			it('should increment version number after update', async () => {
				vi.mocked(getPage).mockResolvedValue({
					id: '12345',
					title: 'Test Page',
					version: { number: 5 },
					body: { storage: { value: '<p>old</p>', representation: 'storage' } },
				});

				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					pageId: '12345',
				});

				expect(result.outputs.version).toBe(6);
			});
		});
	});
});
