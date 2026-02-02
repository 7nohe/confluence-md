import { describe, expect, it } from 'vitest';
import { generateAttachmentFilename, getImageExtension } from '../../src/utils/filename';

describe('utils/filename.ts', () => {
	describe('generateAttachmentFilename', () => {
		it('should return basename for simple filename', () => {
			const existing = new Set<string>();
			expect(generateAttachmentFilename('image.png', existing)).toBe('image.png');
		});

		it('should extract basename from path', () => {
			const existing = new Set<string>();
			expect(generateAttachmentFilename('images/subfolder/photo.jpg', existing)).toBe('photo.jpg');
		});

		it('should strip query parameters', () => {
			const existing = new Set<string>();
			expect(generateAttachmentFilename('image.png?v=1.2.3', existing)).toBe('image.png');
		});

		it('should add .png extension if missing', () => {
			const existing = new Set<string>();
			expect(generateAttachmentFilename('noextension', existing)).toBe('noextension.png');
		});

		it('should add filename to existing set', () => {
			const existing = new Set<string>();
			generateAttachmentFilename('image.png', existing);
			expect(existing.has('image.png')).toBe(true);
		});

		describe('collision handling', () => {
			it('should add _1 suffix for first collision', () => {
				const existing = new Set<string>(['logo.png']);
				expect(generateAttachmentFilename('logo.png', existing)).toBe('logo_1.png');
			});

			it('should add _2 suffix for second collision', () => {
				const existing = new Set<string>(['logo.png', 'logo_1.png']);
				expect(generateAttachmentFilename('logo.png', existing)).toBe('logo_2.png');
			});

			it('should handle multiple collisions', () => {
				const existing = new Set<string>(['logo.png', 'logo_1.png', 'logo_2.png', 'logo_3.png']);
				expect(generateAttachmentFilename('logo.png', existing)).toBe('logo_4.png');
			});

			it('should handle collisions with different paths same basename', () => {
				const existing = new Set<string>();
				expect(generateAttachmentFilename('images/logo.png', existing)).toBe('logo.png');
				expect(generateAttachmentFilename('assets/logo.png', existing)).toBe('logo_1.png');
				expect(generateAttachmentFilename('other/logo.png', existing)).toBe('logo_2.png');
			});

			it('should preserve extension in collision suffix', () => {
				const existing = new Set<string>(['photo.jpeg']);
				expect(generateAttachmentFilename('photo.jpeg', existing)).toBe('photo_1.jpeg');
			});

			it('should handle files with dots in name', () => {
				const existing = new Set<string>(['file.v1.2.png']);
				expect(generateAttachmentFilename('file.v1.2.png', existing)).toBe('file.v1.2_1.png');
			});
		});

		describe('URL handling', () => {
			it('should extract filename from URL', () => {
				const existing = new Set<string>();
				expect(generateAttachmentFilename('https://example.com/images/photo.jpg', existing)).toBe(
					'photo.jpg'
				);
			});

			it('should strip query params from URL', () => {
				const existing = new Set<string>();
				expect(
					generateAttachmentFilename('https://cdn.example.com/img.png?token=abc123', existing)
				).toBe('img.png');
			});

			it('should add extension for URL without extension', () => {
				const existing = new Set<string>();
				expect(generateAttachmentFilename('https://example.com/avatar?size=large', existing)).toBe(
					'avatar.png'
				);
			});
		});
	});

	describe('getImageExtension', () => {
		it('should return extension for common image types', () => {
			expect(getImageExtension('image.png')).toBe('.png');
			expect(getImageExtension('photo.jpg')).toBe('.jpg');
			expect(getImageExtension('photo.jpeg')).toBe('.jpeg');
			expect(getImageExtension('animation.gif')).toBe('.gif');
			expect(getImageExtension('icon.svg')).toBe('.svg');
			expect(getImageExtension('modern.webp')).toBe('.webp');
		});

		it('should lowercase extensions', () => {
			expect(getImageExtension('IMAGE.PNG')).toBe('.png');
			expect(getImageExtension('PHOTO.JPG')).toBe('.jpg');
		});

		it('should strip query parameters', () => {
			expect(getImageExtension('image.png?v=1.2.3')).toBe('.png');
			expect(getImageExtension('image.jpg?width=100&height=200')).toBe('.jpg');
		});

		it('should return .png for files without extension', () => {
			expect(getImageExtension('image')).toBe('.png');
			expect(getImageExtension('noext')).toBe('.png');
		});

		it('should handle paths with directories', () => {
			expect(getImageExtension('images/subfolder/test.png')).toBe('.png');
			expect(getImageExtension('/absolute/path/to/image.jpg')).toBe('.jpg');
		});

		it('should handle URLs', () => {
			expect(getImageExtension('https://example.com/images/photo.jpg')).toBe('.jpg');
			expect(getImageExtension('http://cdn.example.com/assets/icon.svg')).toBe('.svg');
		});

		it('should handle files with multiple dots', () => {
			expect(getImageExtension('my.image.file.png')).toBe('.png');
			expect(getImageExtension('version.1.2.3.jpg')).toBe('.jpg');
		});
	});
});
