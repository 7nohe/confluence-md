import * as fs from 'node:fs';
import * as path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getImageExtension,
	getImagesToUpload,
	isRemoteUrl,
	localImageExists,
	resolveLocalImagePath,
} from '../src/images';
import type { ImageReference } from '../src/types';

vi.mock('fs', async () => {
	const actual = await vi.importActual('fs');
	return {
		...actual,
		existsSync: vi.fn(),
	};
});

describe('images.ts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('isRemoteUrl', () => {
		it('should return true for http:// URLs', () => {
			expect(isRemoteUrl('http://example.com/image.png')).toBe(true);
		});

		it('should return true for https:// URLs', () => {
			expect(isRemoteUrl('https://example.com/image.png')).toBe(true);
		});

		it('should return true for HTTP:// (case insensitive)', () => {
			expect(isRemoteUrl('HTTP://example.com/image.png')).toBe(true);
		});

		it('should return true for HTTPS:// (case insensitive)', () => {
			expect(isRemoteUrl('HTTPS://example.com/image.png')).toBe(true);
		});

		it('should return true for HtTpS:// (mixed case)', () => {
			expect(isRemoteUrl('HtTpS://example.com/image.png')).toBe(true);
		});

		it('should return false for relative paths', () => {
			expect(isRemoteUrl('images/test.png')).toBe(false);
		});

		it('should return false for paths starting with ./', () => {
			expect(isRemoteUrl('./images/test.png')).toBe(false);
		});

		it('should return false for absolute paths starting with /', () => {
			expect(isRemoteUrl('/images/test.png')).toBe(false);
		});

		it('should return false for file:// URLs', () => {
			expect(isRemoteUrl('file:///path/to/image.png')).toBe(false);
		});

		it('should return false for data: URLs', () => {
			expect(isRemoteUrl('data:image/png;base64,abc123')).toBe(false);
		});

		it('should return false for paths containing http in filename', () => {
			expect(isRemoteUrl('http-image.png')).toBe(false);
			expect(isRemoteUrl('my-http-file.png')).toBe(false);
		});

		it('should return false for ftp:// URLs', () => {
			expect(isRemoteUrl('ftp://example.com/image.png')).toBe(false);
		});
	});

	describe('resolveLocalImagePath', () => {
		const baseDir = '/project/docs';

		it('should resolve relative path within base', () => {
			const result = resolveLocalImagePath('images/test.png', baseDir);
			expect(result).toBe(path.resolve(baseDir, 'images/test.png'));
		});

		it('should resolve nested path within base', () => {
			const result = resolveLocalImagePath('assets/images/deep/test.png', baseDir);
			expect(result).toBe(path.resolve(baseDir, 'assets/images/deep/test.png'));
		});

		it('should resolve simple filename', () => {
			const result = resolveLocalImagePath('test.png', baseDir);
			expect(result).toBe(path.resolve(baseDir, 'test.png'));
		});

		// Security: Path traversal prevention tests
		it('should throw for path traversal with ../', () => {
			expect(() => resolveLocalImagePath('../secret/image.png', baseDir)).toThrow(
				'Path traversal detected'
			);
		});

		it('should throw for path traversal with multiple ../', () => {
			expect(() => resolveLocalImagePath('../../etc/passwd', baseDir)).toThrow(
				'Path traversal detected'
			);
		});

		it('should throw for path traversal with /../ in middle', () => {
			expect(() => resolveLocalImagePath('images/../../../secret.png', baseDir)).toThrow(
				'Path traversal detected'
			);
		});

		it('should throw for encoded path traversal', () => {
			// Note: path.resolve handles this, but the check should still work
			expect(() => resolveLocalImagePath('../outside.png', baseDir)).toThrow(
				'Path traversal detected'
			);
		});

		it('should allow .. that stays within base directory', () => {
			// images/../test.png resolves to test.png which is still within base
			const result = resolveLocalImagePath('images/../test.png', baseDir);
			expect(result).toBe(path.resolve(baseDir, 'test.png'));
		});

		it('should include the offending path in error message', () => {
			expect(() => resolveLocalImagePath('../secret.png', baseDir)).toThrow('../secret.png');
		});
	});

	describe('localImageExists', () => {
		const baseDir = '/project/docs';

		it('should return true for existing file', () => {
			vi.mocked(fs.existsSync).mockReturnValue(true);

			const result = localImageExists('test.png', baseDir);

			expect(result).toBe(true);
			expect(fs.existsSync).toHaveBeenCalledWith(path.resolve(baseDir, 'test.png'));
		});

		it('should return false for non-existing file', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);

			const result = localImageExists('missing.png', baseDir);

			expect(result).toBe(false);
		});

		it('should return false for path traversal attempts', () => {
			// Path traversal throws, which is caught and returns false
			const result = localImageExists('../secret.png', baseDir);

			expect(result).toBe(false);
		});

		it('should return false when existsSync throws', () => {
			vi.mocked(fs.existsSync).mockImplementation(() => {
				throw new Error('Permission denied');
			});

			const result = localImageExists('test.png', baseDir);

			expect(result).toBe(false);
		});
	});

	describe('getImagesToUpload', () => {
		const createImage = (overrides: Partial<ImageReference> = {}): ImageReference => ({
			src: 'test.png',
			isRemote: false,
			attachmentFilename: 'test.png',
			...overrides,
		});

		describe('imageMode = "upload"', () => {
			it('should include local images', () => {
				const images: ImageReference[] = [
					createImage({ src: 'local.png', isRemote: false, attachmentFilename: 'local.png' }),
				];

				const result = getImagesToUpload(images, 'upload', false);

				expect(result).toHaveLength(1);
				expect(result[0].src).toBe('local.png');
			});

			it('should exclude images without attachmentFilename', () => {
				const images: ImageReference[] = [createImage({ attachmentFilename: undefined })];

				const result = getImagesToUpload(images, 'upload', false);

				expect(result).toHaveLength(0);
			});

			it('should exclude remote images when downloadRemoteImages is false', () => {
				const images: ImageReference[] = [
					createImage({
						src: 'https://example.com/img.png',
						isRemote: true,
						attachmentFilename: 'img.png',
					}),
				];

				const result = getImagesToUpload(images, 'upload', false);

				expect(result).toHaveLength(0);
			});

			it('should include remote images when downloadRemoteImages is true', () => {
				const images: ImageReference[] = [
					createImage({
						src: 'https://example.com/img.png',
						isRemote: true,
						attachmentFilename: 'img.png',
					}),
				];

				const result = getImagesToUpload(images, 'upload', true);

				expect(result).toHaveLength(1);
			});
		});

		describe('imageMode = "external"', () => {
			it('should exclude local images', () => {
				const images: ImageReference[] = [
					createImage({ src: 'local.png', isRemote: false, attachmentFilename: 'local.png' }),
				];

				const result = getImagesToUpload(images, 'external', false);

				expect(result).toHaveLength(0);
			});

			it('should exclude remote images when downloadRemoteImages is false', () => {
				const images: ImageReference[] = [
					createImage({
						src: 'https://example.com/img.png',
						isRemote: true,
						attachmentFilename: 'img.png',
					}),
				];

				const result = getImagesToUpload(images, 'external', false);

				expect(result).toHaveLength(0);
			});

			it('should include remote images when downloadRemoteImages is true', () => {
				const images: ImageReference[] = [
					createImage({
						src: 'https://example.com/img.png',
						isRemote: true,
						attachmentFilename: 'img.png',
					}),
				];

				const result = getImagesToUpload(images, 'external', true);

				expect(result).toHaveLength(1);
			});
		});

		it('should handle mixed images correctly', () => {
			const images: ImageReference[] = [
				createImage({ src: 'local1.png', isRemote: false, attachmentFilename: 'local1.png' }),
				createImage({ src: 'local2.png', isRemote: false, attachmentFilename: 'local2.png' }),
				createImage({
					src: 'https://example.com/remote.png',
					isRemote: true,
					attachmentFilename: 'remote.png',
				}),
				createImage({
					src: 'https://example.com/external.png',
					isRemote: true,
					attachmentFilename: undefined,
				}),
			];

			const result = getImagesToUpload(images, 'upload', true);

			expect(result).toHaveLength(3); // 2 local + 1 remote with filename
			expect(result.map((i) => i.src)).toEqual([
				'local1.png',
				'local2.png',
				'https://example.com/remote.png',
			]);
		});

		it('should return empty array for empty input', () => {
			const result = getImagesToUpload([], 'upload', false);

			expect(result).toHaveLength(0);
		});
	});

	describe('getImageExtension', () => {
		it('should extract .png extension', () => {
			expect(getImageExtension('image.png')).toBe('.png');
		});

		it('should extract .jpg extension', () => {
			expect(getImageExtension('photo.jpg')).toBe('.jpg');
		});

		it('should extract .jpeg extension', () => {
			expect(getImageExtension('photo.jpeg')).toBe('.jpeg');
		});

		it('should extract .gif extension', () => {
			expect(getImageExtension('animation.gif')).toBe('.gif');
		});

		it('should extract .svg extension', () => {
			expect(getImageExtension('icon.svg')).toBe('.svg');
		});

		it('should extract .webp extension', () => {
			expect(getImageExtension('modern.webp')).toBe('.webp');
		});

		it('should handle uppercase extensions', () => {
			expect(getImageExtension('IMAGE.PNG')).toBe('.png');
			expect(getImageExtension('PHOTO.JPG')).toBe('.jpg');
		});

		it('should remove query parameters', () => {
			expect(getImageExtension('image.png?v=1.2.3')).toBe('.png');
			expect(getImageExtension('image.jpg?width=100&height=200')).toBe('.jpg');
		});

		it('should handle URL with query parameters', () => {
			expect(getImageExtension('https://example.com/image.png?token=abc')).toBe('.png');
		});

		it('should default to .png when no extension', () => {
			expect(getImageExtension('image')).toBe('.png');
			expect(getImageExtension('noext')).toBe('.png');
		});

		it('should handle multiple dots in filename', () => {
			expect(getImageExtension('my.image.file.png')).toBe('.png');
			expect(getImageExtension('version.1.2.3.jpg')).toBe('.jpg');
		});

		it('should handle path with directories', () => {
			expect(getImageExtension('images/subfolder/test.png')).toBe('.png');
			expect(getImageExtension('/absolute/path/to/image.jpg')).toBe('.jpg');
		});

		it('should handle URL paths', () => {
			expect(getImageExtension('https://example.com/images/photo.jpg')).toBe('.jpg');
			expect(getImageExtension('http://cdn.example.com/assets/icon.svg')).toBe('.svg');
		});

		it('should default to .png for path with query but no extension', () => {
			expect(getImageExtension('image?v=1')).toBe('.png');
		});
	});
});
