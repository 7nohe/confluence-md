import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfluenceClient } from '../../src/confluence/client';

// Mock @actions/core
vi.mock('@actions/core', () => ({
	debug: vi.fn(),
}));

// Mock @actions/http-client
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockSendStream = vi.fn();

vi.mock('@actions/http-client', () => ({
	HttpClient: vi.fn().mockImplementation(() => ({
		get: mockGet,
		put: mockPut,
		sendStream: mockSendStream,
	})),
}));

function createMockResponse(statusCode: number, body: unknown) {
	return {
		message: { statusCode },
		readBody: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
	};
}

describe('ConfluenceClient', () => {
	const defaultOptions = {
		baseUrl: 'https://example.atlassian.net/wiki',
		email: 'user@example.com',
		apiToken: 'secret-token',
		userAgent: 'test-agent/1.0',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should store baseUrl and use it in requests', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(200, { id: '123' }));

			await client.get('/api/test');

			expect(mockGet).toHaveBeenCalledWith('https://example.atlassian.net/wiki/api/test');
		});

		it('should handle different baseUrls', async () => {
			const client = new ConfluenceClient({
				...defaultOptions,
				baseUrl: 'https://custom.atlassian.net/wiki/rest',
			});
			mockGet.mockResolvedValue(createMockResponse(200, {}));

			await client.get('/api/content');

			expect(mockGet).toHaveBeenCalledWith('https://custom.atlassian.net/wiki/rest/api/content');
		});
	});

	describe('get', () => {
		it('should make GET request to correct URL', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(200, { data: 'test' }));

			await client.get('/api/v2/pages/123');

			expect(mockGet).toHaveBeenCalledWith('https://example.atlassian.net/wiki/api/v2/pages/123');
		});

		it('should append path to baseUrl', async () => {
			const client = new ConfluenceClient({
				...defaultOptions,
				baseUrl: 'https://custom.atlassian.net/wiki/rest',
			});
			mockGet.mockResolvedValue(createMockResponse(200, {}));

			await client.get('/api/content');

			expect(mockGet).toHaveBeenCalledWith('https://custom.atlassian.net/wiki/rest/api/content');
		});

		it('should return parsed JSON response', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const responseData = { id: '123', title: 'Test Page', version: { number: 1 } };
			mockGet.mockResolvedValue(createMockResponse(200, responseData));

			const result = await client.get('/api/v2/pages/123');

			expect(result).toEqual(responseData);
		});

		it('should throw error on 400 status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(400, { message: 'Bad request' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 400: Bad request');
		});

		it('should throw error on 401 status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(401, { message: 'Unauthorized' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 401: Unauthorized');
		});

		it('should throw error on 403 status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(403, { message: 'Forbidden' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 403: Forbidden');
		});

		it('should throw error on 404 status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(404, { message: 'Page not found' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 404: Page not found');
		});

		it('should throw error on 500 status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(500, { message: 'Internal server error' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 500: Internal server error');
		});

		it('should include errorMessage field from response body', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue(createMockResponse(400, { errorMessage: 'Validation failed' }));

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 400: Validation failed');
		});

		it('should handle non-JSON error response', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue({
				message: { statusCode: 502 },
				readBody: vi.fn().mockResolvedValue('Bad Gateway'),
			});

			await expect(client.get('/api/test')).rejects.toThrow('HTTP 502');
		});

		it('should throw error for invalid JSON response', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue({
				message: { statusCode: 200 },
				readBody: vi.fn().mockResolvedValue('not valid json'),
			});

			await expect(client.get('/api/test')).rejects.toThrow('Failed to parse response as JSON');
		});

		it('should return empty object for empty response body', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockGet.mockResolvedValue({
				message: { statusCode: 200 },
				readBody: vi.fn().mockResolvedValue(''),
			});

			const result = await client.get('/api/test');

			expect(result).toEqual({});
		});
	});

	describe('put', () => {
		it('should make PUT request with JSON body', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const body = { title: 'Updated Page', body: { storage: { value: '<p>Content</p>' } } };
			mockPut.mockResolvedValue(createMockResponse(200, { id: '123' }));

			await client.put('/api/v2/pages/123', body);

			expect(mockPut).toHaveBeenCalledWith(
				'https://example.atlassian.net/wiki/api/v2/pages/123',
				JSON.stringify(body)
			);
		});

		it('should stringify body to JSON', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const body = { nested: { data: [1, 2, 3] } };
			mockPut.mockResolvedValue(createMockResponse(200, {}));

			await client.put('/api/test', body);

			expect(mockPut).toHaveBeenCalledWith(expect.any(String), '{"nested":{"data":[1,2,3]}}');
		});

		it('should return parsed JSON response', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const responseData = { id: '123', version: { number: 2 } };
			mockPut.mockResolvedValue(createMockResponse(200, responseData));

			const result = await client.put('/api/test', {});

			expect(result).toEqual(responseData);
		});

		it('should handle empty response body', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockPut.mockResolvedValue({
				message: { statusCode: 204 },
				readBody: vi.fn().mockResolvedValue(''),
			});

			const result = await client.put('/api/test', {});

			expect(result).toEqual({});
		});

		it('should throw error on 4xx status', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockPut.mockResolvedValue(createMockResponse(409, { message: 'Version conflict' }));

			await expect(client.put('/api/test', {})).rejects.toThrow('HTTP 409: Version conflict');
		});
	});

	describe('postMultipart', () => {
		it('should call sendStream with POST method', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const content = Buffer.from('data');
			mockSendStream.mockResolvedValue(createMockResponse(200, { results: [{}] }));

			await client.postMultipart(
				'/api/v1/content/123/child/attachment',
				'file.png',
				content,
				'image/png'
			);

			expect(mockSendStream).toHaveBeenCalledWith(
				'POST',
				'https://example.atlassian.net/wiki/api/v1/content/123/child/attachment',
				expect.anything() // Readable stream
			);
		});

		it('should return parsed JSON response', async () => {
			const client = new ConfluenceClient(defaultOptions);
			const responseData = { results: [{ id: '789', title: 'attachment.png' }] };
			mockSendStream.mockResolvedValue(createMockResponse(200, responseData));

			const result = await client.postMultipart(
				'/api/attachments',
				'file.png',
				Buffer.from(''),
				'image/png'
			);

			expect(result).toEqual(responseData);
		});

		it('should throw error on failure', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockSendStream.mockResolvedValue(createMockResponse(413, { message: 'File too large' }));

			await expect(
				client.postMultipart('/api/attachments', 'large.png', Buffer.from(''), 'image/png')
			).rejects.toThrow('HTTP 413: File too large');
		});

		it('should make request to correct URL', async () => {
			const client = new ConfluenceClient(defaultOptions);
			mockSendStream.mockResolvedValue(createMockResponse(200, { results: [{}] }));

			await client.postMultipart(
				'/wiki/rest/api/content/12345/child/attachment',
				'img.png',
				Buffer.from('test'),
				'image/png'
			);

			expect(mockSendStream).toHaveBeenCalledWith(
				'POST',
				'https://example.atlassian.net/wiki/wiki/rest/api/content/12345/child/attachment',
				expect.anything()
			);
		});
	});
});
