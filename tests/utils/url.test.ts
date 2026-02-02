import { describe, expect, it } from 'vitest';
import { isRemoteUrl, stripQueryParams } from '../../src/utils/url';

describe('utils/url.ts', () => {
	describe('isRemoteUrl', () => {
		it('should return true for http URLs', () => {
			expect(isRemoteUrl('http://example.com/image.png')).toBe(true);
		});

		it('should return true for https URLs', () => {
			expect(isRemoteUrl('https://example.com/image.png')).toBe(true);
		});

		it('should be case insensitive', () => {
			expect(isRemoteUrl('HTTP://example.com/image.png')).toBe(true);
			expect(isRemoteUrl('HTTPS://example.com/image.png')).toBe(true);
			expect(isRemoteUrl('HtTpS://example.com/image.png')).toBe(true);
		});

		it('should return false for relative paths', () => {
			expect(isRemoteUrl('images/test.png')).toBe(false);
			expect(isRemoteUrl('./images/test.png')).toBe(false);
			expect(isRemoteUrl('../images/test.png')).toBe(false);
		});

		it('should return false for absolute paths', () => {
			expect(isRemoteUrl('/images/test.png')).toBe(false);
		});

		it('should return false for other protocols', () => {
			expect(isRemoteUrl('file:///path/to/image.png')).toBe(false);
			expect(isRemoteUrl('ftp://example.com/image.png')).toBe(false);
			expect(isRemoteUrl('data:image/png;base64,abc123')).toBe(false);
		});

		it('should return false for filenames starting with http', () => {
			expect(isRemoteUrl('http-image.png')).toBe(false);
			expect(isRemoteUrl('https-logo.svg')).toBe(false);
		});
	});

	describe('stripQueryParams', () => {
		it('should remove query parameters', () => {
			expect(stripQueryParams('image.png?v=1.2.3')).toBe('image.png');
		});

		it('should handle multiple query parameters', () => {
			expect(stripQueryParams('image.png?width=100&height=200')).toBe('image.png');
		});

		it('should return original path if no query params', () => {
			expect(stripQueryParams('image.png')).toBe('image.png');
		});

		it('should handle empty string', () => {
			expect(stripQueryParams('')).toBe('');
		});

		it('should handle paths with directories', () => {
			expect(stripQueryParams('images/subfolder/test.png?token=abc')).toBe(
				'images/subfolder/test.png'
			);
		});

		it('should handle URLs with query params', () => {
			expect(stripQueryParams('https://example.com/image.png?token=abc')).toBe(
				'https://example.com/image.png'
			);
		});

		it('should handle only question mark', () => {
			expect(stripQueryParams('image.png?')).toBe('image.png');
		});

		it('should handle question mark in middle of query', () => {
			expect(stripQueryParams('image.png?a=1?b=2')).toBe('image.png');
		});
	});
});
