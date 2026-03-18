import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	extractFirstH1,
	getTitleFromFrontmatter,
	writePageIdToFrontmatter,
} from '../src/frontmatter';

vi.mock('node:fs');

describe('frontmatter utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getTitleFromFrontmatter', () => {
		it('should return title when present', () => {
			expect(getTitleFromFrontmatter({ title: 'My Page' })).toBe('My Page');
		});

		it('should return undefined when title is missing', () => {
			expect(getTitleFromFrontmatter({})).toBeUndefined();
		});

		it('should return undefined when title is null', () => {
			expect(getTitleFromFrontmatter({ title: null })).toBeUndefined();
		});

		it('should return undefined when title is empty string', () => {
			expect(getTitleFromFrontmatter({ title: '' })).toBeUndefined();
		});

		it('should return undefined when title is whitespace only', () => {
			expect(getTitleFromFrontmatter({ title: '   ' })).toBeUndefined();
		});

		it('should trim whitespace', () => {
			expect(getTitleFromFrontmatter({ title: '  My Page  ' })).toBe('My Page');
		});

		it('should convert number to string', () => {
			expect(getTitleFromFrontmatter({ title: 123 })).toBe('123');
		});
	});

	describe('extractFirstH1', () => {
		it('should extract first H1', () => {
			expect(extractFirstH1('# Hello World')).toBe('Hello World');
		});

		it('should extract first H1 from multi-line content', () => {
			const md = 'Some text\n\n# Main Title\n\nMore text\n\n# Second Title';
			expect(extractFirstH1(md)).toBe('Main Title');
		});

		it('should return undefined when no H1 exists', () => {
			expect(extractFirstH1('## Not H1\n\nSome text')).toBeUndefined();
		});

		it('should return undefined for empty string', () => {
			expect(extractFirstH1('')).toBeUndefined();
		});

		it('should trim whitespace from title', () => {
			expect(extractFirstH1('#   Spaced Title  ')).toBe('Spaced Title');
		});

		it('should not match H2 or deeper', () => {
			expect(extractFirstH1('## H2\n### H3')).toBeUndefined();
		});
	});

	describe('writePageIdToFrontmatter', () => {
		it('should write page ID to existing frontmatter', () => {
			const markdown = '---\ntitle: Test\n---\n\n# Content';

			writePageIdToFrontmatter('/path/test.md', markdown, '12345', 'confluence_page_id');

			expect(fs.writeFileSync).toHaveBeenCalledWith(
				'/path/test.md',
				expect.stringContaining('confluence_page_id'),
				'utf-8'
			);
			const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
			expect(writtenContent).toContain('12345');
			expect(writtenContent).toContain('title: Test');
		});

		it('should write page ID to markdown without frontmatter', () => {
			const markdown = '# Just content';

			writePageIdToFrontmatter('/path/test.md', markdown, '67890', 'confluence_page_id');

			const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
			expect(writtenContent).toContain('confluence_page_id');
			expect(writtenContent).toContain('67890');
			expect(writtenContent).toContain('# Just content');
		});

		it('should preserve existing frontmatter fields', () => {
			const markdown = '---\ntitle: My Page\nauthor: Test\n---\n\n# Content';

			writePageIdToFrontmatter('/path/test.md', markdown, '12345', 'confluence_page_id');

			const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
			expect(writtenContent).toContain('title: My Page');
			expect(writtenContent).toContain('author: Test');
			expect(writtenContent).toContain('confluence_page_id');
			expect(writtenContent).toContain('12345');
		});

		it('should use custom key', () => {
			const markdown = '---\ntitle: Test\n---\n\n# Content';

			writePageIdToFrontmatter('/path/test.md', markdown, '99999', 'custom_page_id');

			const writtenContent = vi.mocked(fs.writeFileSync).mock.calls[0][1] as string;
			expect(writtenContent).toContain('custom_page_id');
			expect(writtenContent).toContain('99999');
		});
	});
});
