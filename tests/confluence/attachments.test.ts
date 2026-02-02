import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadAttachment, uploadAttachments } from '../../src/confluence/attachments';
import type { ConfluenceClient } from '../../src/confluence/client';
import type { ImageReference } from '../../src/types';

// Mock @actions/core
vi.mock('@actions/core', () => ({
	info: vi.fn(),
	debug: vi.fn(),
	warning: vi.fn(),
}));

// Mock @actions/http-client for downloadImage
const mockHttpGet = vi.fn();
vi.mock('@actions/http-client', () => ({
	HttpClient: vi.fn().mockImplementation(() => ({
		get: mockHttpGet,
	})),
}));

// Mock fs
vi.mock('fs', async () => {
	const actual = await vi.importActual('fs');
	return {
		...actual,
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
	};
});

describe('attachments.ts', () => {
	let mockClient: {
		postMultipart: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		vi.clearAllMocks();
		mockClient = {
			postMultipart: vi.fn(),
		};
	});

	describe('uploadAttachment', () => {
		it('should use v1 API endpoint', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '123', title: 'test.png', mediaType: 'image/png', fileSize: 1024 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'test.png',
				Buffer.from('image data')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				'/wiki/rest/api/content/12345/child/attachment',
				expect.any(String),
				expect.any(Buffer),
				expect.any(String)
			);
		});

		it('should pass filename and content', async () => {
			const content = Buffer.from('test image content');
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '123', title: 'myimage.jpg', mediaType: 'image/jpeg', fileSize: 2048 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'myimage.jpg',
				content
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				'myimage.jpg',
				content,
				expect.any(String)
			);
		});

		it('should determine MIME type from .png extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'image.png', mediaType: 'image/png', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'image.png',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/png'
			);
		});

		it('should determine MIME type from .jpg extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'photo.jpg', mediaType: 'image/jpeg', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'photo.jpg',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/jpeg'
			);
		});

		it('should determine MIME type from .jpeg extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'photo.jpeg', mediaType: 'image/jpeg', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'photo.jpeg',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/jpeg'
			);
		});

		it('should determine MIME type from .gif extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'anim.gif', mediaType: 'image/gif', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'anim.gif',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/gif'
			);
		});

		it('should determine MIME type from .svg extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'icon.svg', mediaType: 'image/svg+xml', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'icon.svg',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/svg+xml'
			);
		});

		it('should determine MIME type from .webp extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'modern.webp', mediaType: 'image/webp', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'modern.webp',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/webp'
			);
		});

		it('should determine MIME type from .pdf extension', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'doc.pdf', mediaType: 'application/pdf', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'doc.pdf',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'application/pdf'
			);
		});

		it('should use application/octet-stream for unknown extensions', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [
					{ id: '1', title: 'file.xyz', mediaType: 'application/octet-stream', fileSize: 100 },
				],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'file.xyz',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'application/octet-stream'
			);
		});

		it('should handle uppercase extensions', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'IMAGE.PNG', mediaType: 'image/png', fileSize: 100 }],
			});

			await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'IMAGE.PNG',
				Buffer.from('')
			);

			expect(mockClient.postMultipart).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(String),
				expect.any(Buffer),
				'image/png'
			);
		});

		it('should return first result from response', async () => {
			const attachment = { id: '456', title: 'test.png', mediaType: 'image/png', fileSize: 1024 };
			mockClient.postMultipart.mockResolvedValue({
				results: [attachment],
			});

			const result = await uploadAttachment(
				mockClient as unknown as ConfluenceClient,
				'12345',
				'test.png',
				Buffer.from('')
			);

			expect(result).toEqual(attachment);
		});

		it('should throw error when results empty', async () => {
			mockClient.postMultipart.mockResolvedValue({
				results: [],
			});

			await expect(
				uploadAttachment(
					mockClient as unknown as ConfluenceClient,
					'12345',
					'test.png',
					Buffer.from('')
				)
			).rejects.toThrow('Failed to upload attachment: test.png');
		});

		it('should throw error when results undefined', async () => {
			mockClient.postMultipart.mockResolvedValue({});

			await expect(
				uploadAttachment(
					mockClient as unknown as ConfluenceClient,
					'12345',
					'test.png',
					Buffer.from('')
				)
			).rejects.toThrow('Failed to upload attachment: test.png');
		});
	});

	describe('uploadAttachments', () => {
		it('should upload local images', async () => {
			const images: ImageReference[] = [
				{ src: 'test.png', isRemote: false, attachmentFilename: 'test.png' },
			];
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('image data'));
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'test.png', mediaType: 'image/png', fileSize: 100 }],
			});

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(1);
			expect(fs.readFileSync).toHaveBeenCalled();
			expect(mockClient.postMultipart).toHaveBeenCalled();
		});

		it('should skip images without attachmentFilename', async () => {
			const images: ImageReference[] = [
				{ src: 'https://example.com/external.png', isRemote: true, attachmentFilename: undefined },
			];

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(0);
			expect(mockClient.postMultipart).not.toHaveBeenCalled();
		});

		it('should warn and continue when local file not found', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const images: ImageReference[] = [
				{ src: 'missing.png', isRemote: false, attachmentFilename: 'missing.png' },
			];
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(0);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing.png'));
			warnSpy.mockRestore();
		});

		it('should download and upload remote images', async () => {
			const images: ImageReference[] = [
				{ src: 'https://example.com/remote.png', isRemote: true, attachmentFilename: 'remote.png' },
			];
			mockHttpGet.mockResolvedValue({
				message: { statusCode: 200 },
				readBodyBuffer: vi.fn().mockResolvedValue(Buffer.from('remote image data')),
			});
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'remote.png', mediaType: 'image/png', fileSize: 100 }],
			});

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(1);
			expect(mockHttpGet).toHaveBeenCalledWith('https://example.com/remote.png');
		});

		it('should handle download failure gracefully', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const images: ImageReference[] = [
				{ src: 'https://example.com/broken.png', isRemote: true, attachmentFilename: 'broken.png' },
			];
			mockHttpGet.mockResolvedValue({
				message: { statusCode: 404 },
			});

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(0);
			expect(warnSpy).toHaveBeenCalled();
			warnSpy.mockRestore();
		});

		it('should throw for path traversal attempts', async () => {
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const images: ImageReference[] = [
				{ src: '../../../etc/passwd', isRemote: false, attachmentFilename: 'passwd' },
			];
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('secret'));

			// The error is caught and logged as warning, not thrown
			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(0);
			expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Path traversal detected'));
			warnSpy.mockRestore();
		});

		it('should return count of successfully uploaded images', async () => {
			const images: ImageReference[] = [
				{ src: 'image1.png', isRemote: false, attachmentFilename: 'image1.png' },
				{ src: 'image2.png', isRemote: false, attachmentFilename: 'image2.png' },
				{ src: 'image3.png', isRemote: false, attachmentFilename: 'image3.png' },
			];
			vi.mocked(fs.existsSync).mockReturnValue(true);
			vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'image.png', mediaType: 'image/png', fileSize: 100 }],
			});

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(3);
		});

		it('should handle mixed success and failure', async () => {
			const images: ImageReference[] = [
				{ src: 'success.png', isRemote: false, attachmentFilename: 'success.png' },
				{ src: 'missing.png', isRemote: false, attachmentFilename: 'missing.png' },
				{ src: 'another.png', isRemote: false, attachmentFilename: 'another.png' },
			];
			vi.mocked(fs.existsSync)
				.mockReturnValueOnce(true)
				.mockReturnValueOnce(false)
				.mockReturnValueOnce(true);
			vi.mocked(fs.readFileSync).mockReturnValue(Buffer.from('data'));
			mockClient.postMultipart.mockResolvedValue({
				results: [{ id: '1', title: 'image.png', mediaType: 'image/png', fileSize: 100 }],
			});

			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				images,
				'/project/docs'
			);

			expect(count).toBe(2); // Only 2 out of 3 succeeded
		});

		it('should return 0 for empty images array', async () => {
			const count = await uploadAttachments(
				mockClient as unknown as ConfluenceClient,
				'12345',
				[],
				'/project/docs'
			);

			expect(count).toBe(0);
		});
	});
});
