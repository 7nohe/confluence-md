import { describe, expect, it } from 'vitest';
import { convertMarkdown } from '../src/converter';
import {
	createElement,
	createImage,
	createMacro,
	escapeXml,
	wrapCData,
} from '../src/converter/xml';
import {
	extractFrontmatter,
	getPageIdFromFrontmatter,
	getTitleFromFrontmatter,
} from '../src/frontmatter';

describe('XML utilities', () => {
	describe('escapeXml', () => {
		it('should escape ampersand', () => {
			expect(escapeXml('foo & bar')).toBe('foo &amp; bar');
		});

		it('should escape angle brackets', () => {
			expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
		});

		it('should escape quotes', () => {
			expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
		});

		it('should handle multiple special characters', () => {
			expect(escapeXml('<a href="test">foo & bar</a>')).toBe(
				'&lt;a href=&quot;test&quot;&gt;foo &amp; bar&lt;/a&gt;'
			);
		});
	});

	describe('wrapCData', () => {
		it('should wrap content in CDATA', () => {
			expect(wrapCData('test')).toBe('<![CDATA[test]]>');
		});

		it('should handle nested CDATA sequences', () => {
			expect(wrapCData('test]]>more')).toBe('<![CDATA[test]]]]><![CDATA[>more]]>');
		});
	});

	describe('createElement', () => {
		it('should create self-closing tag without content', () => {
			expect(createElement('br')).toBe('<br/>');
		});

		it('should create tag with content', () => {
			expect(createElement('p', undefined, 'text')).toBe('<p>text</p>');
		});

		it('should create tag with attributes', () => {
			expect(createElement('a', { href: 'http://example.com' }, 'link')).toBe(
				'<a href="http://example.com">link</a>'
			);
		});

		it('should escape attribute values', () => {
			expect(createElement('a', { title: '"quoted"' }, 'link')).toBe(
				'<a title="&quot;quoted&quot;">link</a>'
			);
		});
	});

	describe('createMacro', () => {
		it('should create code macro', () => {
			const result = createMacro('code', { language: 'javascript' }, 'const x = 1;');
			expect(result).toContain('ac:name="code"');
			expect(result).toContain('ac:name="language"');
			expect(result).toContain('javascript');
			expect(result).toContain('<![CDATA[const x = 1;]]>');
		});

		it('should create mermaid macro', () => {
			const result = createMacro('mermaid', undefined, 'graph TD\n  A-->B');
			expect(result).toContain('ac:name="mermaid"');
			expect(result).toContain('graph TD');
		});
	});

	describe('createImage', () => {
		it('should create attachment image', () => {
			const result = createImage({ type: 'attachment', filename: 'test.png' }, 'Alt text');
			expect(result).toContain('ri:filename="test.png"');
			expect(result).toContain('ac:alt="Alt text"');
		});

		it('should create external URL image', () => {
			const result = createImage({ type: 'url', url: 'https://example.com/img.png' });
			expect(result).toContain('ri:value="https://example.com/img.png"');
		});
	});
});

describe('Markdown conversion', () => {
	const defaultOptions = {
		attachmentsBase: '/test',
		imageMode: 'upload' as const,
		downloadRemoteImages: false,
	};

	describe('headings', () => {
		it('should convert h1', () => {
			const { storage } = convertMarkdown('# Heading 1', defaultOptions);
			expect(storage).toBe('<h1>Heading 1</h1>');
		});

		it('should convert h2-h6', () => {
			const { storage } = convertMarkdown(
				'## H2\n### H3\n#### H4\n##### H5\n###### H6',
				defaultOptions
			);
			expect(storage).toContain('<h2>H2</h2>');
			expect(storage).toContain('<h3>H3</h3>');
			expect(storage).toContain('<h4>H4</h4>');
			expect(storage).toContain('<h5>H5</h5>');
			expect(storage).toContain('<h6>H6</h6>');
		});
	});

	describe('paragraphs and inline formatting', () => {
		it('should convert paragraphs', () => {
			const { storage } = convertMarkdown('Hello world', defaultOptions);
			expect(storage).toBe('<p>Hello world</p>');
		});

		it('should convert bold text', () => {
			const { storage } = convertMarkdown('**bold**', defaultOptions);
			expect(storage).toBe('<p><strong>bold</strong></p>');
		});

		it('should convert italic text', () => {
			const { storage } = convertMarkdown('*italic*', defaultOptions);
			expect(storage).toBe('<p><em>italic</em></p>');
		});

		it('should convert strikethrough (GFM)', () => {
			const { storage } = convertMarkdown('~~deleted~~', defaultOptions);
			expect(storage).toBe('<p><del>deleted</del></p>');
		});

		it('should convert inline code', () => {
			const { storage } = convertMarkdown('`code`', defaultOptions);
			expect(storage).toBe('<p><code>code</code></p>');
		});
	});

	describe('lists', () => {
		it('should convert unordered lists', () => {
			const { storage } = convertMarkdown('- Item 1\n- Item 2', defaultOptions);
			expect(storage).toContain('<ul>');
			expect(storage).toContain('<li>Item 1</li>');
			expect(storage).toContain('<li>Item 2</li>');
			expect(storage).toContain('</ul>');
		});

		it('should convert ordered lists', () => {
			const { storage } = convertMarkdown('1. First\n2. Second', defaultOptions);
			expect(storage).toContain('<ol>');
			expect(storage).toContain('<li>First</li>');
			expect(storage).toContain('<li>Second</li>');
			expect(storage).toContain('</ol>');
		});

		it('should convert task lists with text fallback', () => {
			const { storage } = convertMarkdown('- [ ] Todo\n- [x] Done', defaultOptions);
			expect(storage).toContain('[ ] Todo');
			expect(storage).toContain('[x] Done');
		});
	});

	describe('code blocks', () => {
		it('should convert code block to code macro', () => {
			const { storage } = convertMarkdown('```javascript\nconst x = 1;\n```', defaultOptions);
			expect(storage).toContain('ac:name="code"');
			expect(storage).toContain('ac:name="language"');
			expect(storage).toContain('javascript');
		});

		it('should convert mermaid block to mermaid macro', () => {
			const { storage } = convertMarkdown('```mermaid\ngraph TD\n  A-->B\n```', defaultOptions);
			expect(storage).toContain('ac:name="mermaid"');
			expect(storage).toContain('graph TD');
		});
	});

	describe('tables (GFM)', () => {
		it('should convert tables', () => {
			const md = `| A | B |
| --- | --- |
| 1 | 2 |`;
			const { storage } = convertMarkdown(md, defaultOptions);
			expect(storage).toContain('<table>');
			expect(storage).toContain('<thead>');
			expect(storage).toContain('<th>A</th>');
			expect(storage).toContain('<tbody>');
			expect(storage).toContain('<td>1</td>');
		});

		it('should preserve <br> inside table cells', () => {
			const md = `| A |
| --- |
| foo<br>bar |`;
			const { storage } = convertMarkdown(md, defaultOptions);
			expect(storage).toContain('<td>foo<br/>bar</td>');
		});

		it('should preserve <br/> inside table cells', () => {
			const md = `| A |
| --- |
| foo<br/>bar |`;
			const { storage } = convertMarkdown(md, defaultOptions);
			expect(storage).toContain('<td>foo<br/>bar</td>');
		});

		it('should strip non-break HTML inside table cells', () => {
			const md = `| A |
| --- |
| <span>foo</span> |`;
			const { storage } = convertMarkdown(md, defaultOptions);
			expect(storage).toContain('<td>foo</td>');
			expect(storage).not.toContain('<span>');
		});
	});

	describe('links', () => {
		it('should convert links', () => {
			const { storage } = convertMarkdown('[Link](https://example.com)', defaultOptions);
			expect(storage).toContain('<a href="https://example.com">Link</a>');
		});

		it('should convert links with title', () => {
			const { storage } = convertMarkdown('[Link](https://example.com "Title")', defaultOptions);
			expect(storage).toContain('href="https://example.com"');
			expect(storage).toContain('title="Title"');
		});
	});

	describe('images', () => {
		it('should convert local images to attachment', () => {
			const { storage, images } = convertMarkdown('![Alt](image.png)', defaultOptions);
			expect(storage).toContain('ri:filename="image.png"');
			expect(storage).toContain('ac:alt="Alt"');
			expect(images).toHaveLength(1);
			expect(images[0].attachmentFilename).toBe('image.png');
		});

		it('should convert remote images to external URL', () => {
			const { storage, images } = convertMarkdown(
				'![Alt](https://example.com/image.png)',
				defaultOptions
			);
			expect(storage).toContain('ri:value="https://example.com/image.png"');
			expect(images).toHaveLength(1);
			expect(images[0].isRemote).toBe(true);
		});

		it('should download remote images when enabled', () => {
			const { storage, images } = convertMarkdown('![Alt](https://example.com/image.png)', {
				...defaultOptions,
				downloadRemoteImages: true,
			});
			expect(storage).toContain('ri:filename=');
			expect(images[0].attachmentFilename).toBeTruthy();
		});
	});

	describe('blockquotes', () => {
		it('should convert blockquotes', () => {
			const { storage } = convertMarkdown('> Quote', defaultOptions);
			expect(storage).toContain('<blockquote>');
			expect(storage).toContain('Quote');
		});
	});

	describe('horizontal rules', () => {
		it('should convert horizontal rules', () => {
			const { storage } = convertMarkdown('---', defaultOptions);
			expect(storage).toContain('<hr/>');
		});
	});
});

describe('Frontmatter extraction', () => {
	it('should extract YAML frontmatter', () => {
		const md = `---
title: Test
confluence_page_id: 12345
---

# Content`;
		const { data, content } = extractFrontmatter(md);
		expect(data.title).toBe('Test');
		expect(data.confluence_page_id).toBe(12345);
		expect(content.trim()).toBe('# Content');
	});

	it('should handle missing frontmatter', () => {
		const { data, content } = extractFrontmatter('# Just content');
		expect(Object.keys(data)).toHaveLength(0);
		expect(content.trim()).toBe('# Just content');
	});

	describe('getPageIdFromFrontmatter', () => {
		it('should get page ID from frontmatter', () => {
			const pageId = getPageIdFromFrontmatter(
				{ confluence_page_id: '12345' },
				'confluence_page_id'
			);
			expect(pageId).toBe('12345');
		});

		it('should handle numeric page ID', () => {
			const pageId = getPageIdFromFrontmatter({ confluence_page_id: 12345 }, 'confluence_page_id');
			expect(pageId).toBe('12345');
		});

		it('should return undefined for missing key', () => {
			const pageId = getPageIdFromFrontmatter({}, 'confluence_page_id');
			expect(pageId).toBeUndefined();
		});

		it('should use custom key', () => {
			const pageId = getPageIdFromFrontmatter({ custom_id: '99999' }, 'custom_id');
			expect(pageId).toBe('99999');
		});
	});

	describe('getTitleFromFrontmatter', () => {
		it('should get title from frontmatter', () => {
			const title = getTitleFromFrontmatter({ title: 'Test Title' });
			expect(title).toBe('Test Title');
		});

		it('should trim title from frontmatter', () => {
			const title = getTitleFromFrontmatter({ title: '  Test Title  ' });
			expect(title).toBe('Test Title');
		});

		it('should stringify scalar YAML titles', () => {
			expect(getTitleFromFrontmatter({ title: 2026 })).toBe('2026');
			expect(getTitleFromFrontmatter({ title: true })).toBe('true');
		});

		it('should return undefined for missing or empty title', () => {
			expect(getTitleFromFrontmatter({})).toBeUndefined();
			expect(getTitleFromFrontmatter({ title: '   ' })).toBeUndefined();
			expect(getTitleFromFrontmatter({ title: null })).toBeUndefined();
		});
	});
});
