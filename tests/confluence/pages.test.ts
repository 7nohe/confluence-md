import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConfluenceClient } from '../../src/confluence/client';
import { buildPageUrl, getPage, updatePage } from '../../src/confluence/pages';
import type { ConfluencePage } from '../../src/types';

// Mock @actions/core
vi.mock('@actions/core', () => ({
	info: vi.fn(),
	debug: vi.fn(),
}));

describe('pages.ts', () => {
	let mockClient: {
		get: ReturnType<typeof vi.fn>;
		put: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockClient = {
			get: vi.fn(),
			put: vi.fn(),
		};
	});

	describe('getPage', () => {
		it('should call client.get with correct v2 API path', async () => {
			const mockPage: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 1 },
			};
			mockClient.get.mockResolvedValue(mockPage);

			await getPage(mockClient as unknown as ConfluenceClient, '12345');

			expect(mockClient.get).toHaveBeenCalledWith('/wiki/api/v2/pages/12345?body-format=storage');
		});

		it('should include body-format=storage query param', async () => {
			const mockPage: ConfluencePage = {
				id: '67890',
				title: 'Another Page',
				version: { number: 5 },
			};
			mockClient.get.mockResolvedValue(mockPage);

			await getPage(mockClient as unknown as ConfluenceClient, '67890');

			expect(mockClient.get).toHaveBeenCalledWith(expect.stringContaining('body-format=storage'));
		});

		it('should return page object', async () => {
			const mockPage: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 3 },
				body: {
					storage: {
						value: '<p>Content</p>',
						representation: 'storage',
					},
				},
			};
			mockClient.get.mockResolvedValue(mockPage);

			const result = await getPage(mockClient as unknown as ConfluenceClient, '12345');

			expect(result).toEqual(mockPage);
			expect(result.id).toBe('12345');
			expect(result.title).toBe('Test Page');
			expect(result.version.number).toBe(3);
		});

		it('should propagate errors from client', async () => {
			mockClient.get.mockRejectedValue(new Error('HTTP 404: Page not found'));

			await expect(getPage(mockClient as unknown as ConfluenceClient, '99999')).rejects.toThrow(
				'HTTP 404: Page not found'
			);
		});
	});

	describe('updatePage', () => {
		it('should call client.put with correct path', async () => {
			const updatedPage: ConfluencePage = {
				id: '12345',
				title: 'Updated Title',
				version: { number: 2 },
			};
			mockClient.put.mockResolvedValue(updatedPage);

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Updated Title',
				'<p>New content</p>',
				1
			);

			expect(mockClient.put).toHaveBeenCalledWith('/wiki/api/v2/pages/12345', expect.any(Object));
		});

		it('should increment version number by 1', async () => {
			const updatedPage: ConfluencePage = {
				id: '12345',
				title: 'Title',
				version: { number: 6 },
			};
			mockClient.put.mockResolvedValue(updatedPage);

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Title',
				'<p>Content</p>',
				5
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					version: expect.objectContaining({
						number: 6,
					}),
				})
			);
		});

		it('should include title in update body', async () => {
			mockClient.put.mockResolvedValue({
				id: '12345',
				title: 'My Custom Title',
				version: { number: 2 },
			});

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'My Custom Title',
				'<p>Content</p>',
				1
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					title: 'My Custom Title',
				})
			);
		});

		it('should include storage representation', async () => {
			mockClient.put.mockResolvedValue({
				id: '12345',
				title: 'Title',
				version: { number: 2 },
			});

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Title',
				'<h1>Header</h1><p>Paragraph</p>',
				1
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: {
						representation: 'storage',
						value: '<h1>Header</h1><p>Paragraph</p>',
					},
				})
			);
		});

		it('should use default version message when not provided', async () => {
			mockClient.put.mockResolvedValue({
				id: '12345',
				title: 'Title',
				version: { number: 2 },
			});

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Title',
				'<p>Content</p>',
				1
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					version: expect.objectContaining({
						message: 'Updated by confluence-md',
					}),
				})
			);
		});

		it('should use custom version message when provided', async () => {
			mockClient.put.mockResolvedValue({
				id: '12345',
				title: 'Title',
				version: { number: 2 },
			});

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Title',
				'<p>Content</p>',
				1,
				'Custom update message'
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					version: expect.objectContaining({
						message: 'Custom update message',
					}),
				})
			);
		});

		it('should return updated page', async () => {
			const updatedPage: ConfluencePage = {
				id: '12345',
				title: 'Updated Title',
				version: { number: 10 },
			};
			mockClient.put.mockResolvedValue(updatedPage);

			const result = await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Updated Title',
				'<p>Content</p>',
				9
			);

			expect(result).toEqual(updatedPage);
			expect(result.version.number).toBe(10);
		});

		it('should include page ID and status in update body', async () => {
			mockClient.put.mockResolvedValue({
				id: '12345',
				title: 'Title',
				version: { number: 2 },
			});

			await updatePage(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'Title',
				'<p>Content</p>',
				1
			);

			expect(mockClient.put).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					id: '12345',
					status: 'current',
				})
			);
		});

		it('should propagate errors from client', async () => {
			mockClient.put.mockRejectedValue(new Error('HTTP 409: Version conflict'));

			await expect(
				updatePage(mockClient as unknown as ConfluenceClient, '12345', 'Title', '<p>Content</p>', 5)
			).rejects.toThrow('HTTP 409: Version conflict');
		});
	});

	describe('buildPageUrl', () => {
		it('should construct URL from _links.webui', () => {
			const page: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 1 },
				_links: {
					webui: '/spaces/SPACE/pages/12345/Test+Page',
				},
			};

			const result = buildPageUrl('https://example.atlassian.net/wiki', page);

			expect(result).toBe('https://example.atlassian.net/wiki/spaces/SPACE/pages/12345/Test+Page');
		});

		it('should use _links.base when available', () => {
			const page: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 1 },
				_links: {
					webui: '/spaces/SPACE/pages/12345/Test+Page',
					base: 'https://custom.atlassian.net/wiki',
				},
			};

			const result = buildPageUrl('https://example.atlassian.net/wiki', page);

			expect(result).toBe('https://custom.atlassian.net/wiki/spaces/SPACE/pages/12345/Test+Page');
		});

		it('should use baseUrl when _links.base not available', () => {
			const page: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 1 },
				_links: {
					webui: '/spaces/TEAM/pages/12345',
				},
			};

			const result = buildPageUrl('https://mycompany.atlassian.net/wiki', page);

			expect(result).toBe('https://mycompany.atlassian.net/wiki/spaces/TEAM/pages/12345');
		});

		it('should return fallback URL when _links.webui missing', () => {
			const page: ConfluencePage = {
				id: '12345',
				title: 'Test Page',
				version: { number: 1 },
			};

			const result = buildPageUrl('https://example.atlassian.net/wiki', page);

			expect(result).toBe('https://example.atlassian.net/wiki/wiki/spaces/~/12345');
		});

		it('should return fallback URL when _links is empty object', () => {
			const page: ConfluencePage = {
				id: '67890',
				title: 'Another Page',
				version: { number: 2 },
				_links: {},
			};

			const result = buildPageUrl('https://example.atlassian.net/wiki', page);

			expect(result).toBe('https://example.atlassian.net/wiki/wiki/spaces/~/67890');
		});
	});
});
