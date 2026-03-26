import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runConversion } from '../src/core';
import type { ActionInputs, PageTarget } from '../src/types';

// Mock confluence modules
vi.mock('../src/confluence/client', () => ({
	ConfluenceClient: vi.fn().mockImplementation(() => ({
		get: vi.fn(),
		put: vi.fn(),
		post: vi.fn(),
		postMultipart: vi.fn(),
	})),
}));

vi.mock('../src/confluence/pages', () => ({
	getPage: vi.fn(),
	updatePage: vi.fn(),
	createPage: vi.fn(),
	resolveSpaceId: vi.fn(),
	buildPageUrl: vi.fn(),
}));

vi.mock('../src/confluence/attachments', () => ({
	uploadAttachments: vi.fn(),
}));

import { uploadAttachments } from '../src/confluence/attachments';
// Import mocked modules
import { ConfluenceClient } from '../src/confluence/client';
import {
	buildPageUrl,
	createPage,
	getPage,
	resolveSpaceId,
	updatePage,
} from '../src/confluence/pages';

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

	const updateTarget: PageTarget = { mode: 'update', pageId: '12345' };
	const createTarget: PageTarget = { mode: 'create', spaceKey: 'MYSPACE' };

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('runConversion', () => {
		describe('dry run mode (update)', () => {
			it('should skip API calls in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(ConfluenceClient).not.toHaveBeenCalled();
				expect(getPage).not.toHaveBeenCalled();
				expect(updatePage).not.toHaveBeenCalled();
				expect(result.outputs.updated).toBe(false);
				expect(result.outputs.created).toBe(false);
				expect(result.outputs.version).toBe(0);
			});

			it('should return storage content in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(result.storage).toBeDefined();
				expect(result.storage).toContain('<h1>Test</h1>');
			});

			it('should return correct page URL format in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(result.outputs.contentHash).toBeDefined();
				expect(result.outputs.contentHash).toHaveLength(16);
			});

			it('should count images in dry run mode', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test\n\n![alt](image.png)',
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(result.imagesCount).toBe(1);
			});
		});

		describe('dry run mode (create)', () => {
			it('should return created=true and pageId=NEW', async () => {
				const result = await runConversion({
					inputs: { ...baseInputs, dryRun: true },
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(result.outputs.created).toBe(true);
				expect(result.outputs.pageId).toBe('NEW');
				expect(ConfluenceClient).not.toHaveBeenCalled();
			});
		});

		describe('update mode', () => {
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
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(getPage).toHaveBeenCalledWith(expect.anything(), '12345');
			});

			it('should update page when content differs', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# New Content',
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(updatePage).toHaveBeenCalled();
				expect(result.outputs.updated).toBe(true);
			});

			it('should upload attachments when images are present', async () => {
				vi.mocked(uploadAttachments).mockResolvedValue(2);

				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test\n\n![img1](a.png)\n![img2](b.png)',
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(uploadAttachments).toHaveBeenCalled();
				expect(result.outputs.attachmentsUploaded).toBe(2);
			});

			it('should use titleOverride when provided', async () => {
				await runConversion({
					inputs: { ...baseInputs, titleOverride: 'Custom Title' },
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
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
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(result.outputs.pageUrl).toBe(
					'https://example.atlassian.net/wiki/spaces/TEST/pages/12345'
				);
				expect(result.outputs.pageId).toBe('12345');
				expect(result.outputs.version).toBe(2);
				expect(result.outputs.updated).toBe(true);
				expect(result.outputs.created).toBe(false);
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
					frontmatter: {},
					pageTarget: updateTarget,
				});

				expect(result.outputs.version).toBe(6);
			});
		});

		describe('create mode', () => {
			beforeEach(() => {
				vi.mocked(resolveSpaceId).mockResolvedValue('space-id-123');
				vi.mocked(createPage).mockResolvedValue({
					id: '99999',
					title: 'New Page',
					version: { number: 1 },
					_links: { webui: '/spaces/MYSPACE/pages/99999' },
				});
				vi.mocked(buildPageUrl).mockReturnValue(
					'https://example.atlassian.net/wiki/spaces/MYSPACE/pages/99999'
				);
				vi.mocked(uploadAttachments).mockResolvedValue(0);
			});

			it('should resolve space ID and create page', async () => {
				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# My New Page',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(resolveSpaceId).toHaveBeenCalledWith(expect.anything(), 'MYSPACE');
				expect(createPage).toHaveBeenCalledWith(
					expect.anything(),
					'My New Page',
					'space-id-123',
					expect.any(String),
					undefined
				);
				expect(result.outputs.created).toBe(true);
				expect(result.outputs.pageId).toBe('99999');
			});

			it('should use titleOverride over H1', async () => {
				await runConversion({
					inputs: { ...baseInputs, titleOverride: 'Override Title' },
					markdownContent: '# H1 Title',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(createPage).toHaveBeenCalledWith(
					expect.anything(),
					'Override Title',
					expect.any(String),
					expect.any(String),
					undefined
				);
			});

			it('should use frontmatter title over H1', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# H1 Title',
					frontmatter: { title: 'FM Title' },
					pageTarget: createTarget,
				});

				expect(createPage).toHaveBeenCalledWith(
					expect.anything(),
					'FM Title',
					expect.any(String),
					expect.any(String),
					undefined
				);
			});

			it('should use filename as fallback title', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: 'No heading here',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(createPage).toHaveBeenCalledWith(
					expect.anything(),
					'test',
					expect.any(String),
					expect.any(String),
					undefined
				);
			});

			it('should pass parentPageId when provided', async () => {
				const targetWithParent: PageTarget = {
					mode: 'create',
					spaceKey: 'MYSPACE',
					parentPageId: '11111',
				};

				await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: targetWithParent,
				});

				expect(createPage).toHaveBeenCalledWith(
					expect.anything(),
					'Test',
					'space-id-123',
					expect.any(String),
					'11111'
				);
			});

			it('should upload attachments after creating page', async () => {
				vi.mocked(uploadAttachments).mockResolvedValue(2);

				const result = await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test\n\n![img](pic.png)',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(uploadAttachments).toHaveBeenCalledWith(
					expect.anything(),
					'99999',
					expect.any(Array),
					'.'
				);
				expect(result.outputs.attachmentsUploaded).toBe(2);
			});

			it('should not call getPage or updatePage', async () => {
				await runConversion({
					inputs: baseInputs,
					markdownContent: '# Test',
					frontmatter: {},
					pageTarget: createTarget,
				});

				expect(getPage).not.toHaveBeenCalled();
				expect(updatePage).not.toHaveBeenCalled();
			});
		});
	});
});
