import type { Parent } from 'unist';
import { describe, expect, it } from 'vitest';
import { codeHandler } from '../../src/converter/handlers/code';
import { createHandlerRegistry } from '../../src/converter/handlers/index';
import { imageHandler, linkHandler } from '../../src/converter/handlers/link';
import { listHandler, listItemHandler } from '../../src/converter/handlers/list';
import {
	blockquoteHandler,
	breakHandler,
	headingHandler,
	htmlHandler,
	paragraphHandler,
	thematicBreakHandler,
} from '../../src/converter/handlers/structure';
import {
	tableCellHandler,
	tableHandler,
	tableRowHandler,
} from '../../src/converter/handlers/table';
import {
	deleteHandler,
	emphasisHandler,
	inlineCodeHandler,
	strongHandler,
	textHandler,
} from '../../src/converter/handlers/text';
import type { ConversionState, MdastNode } from '../../src/converter/handlers/types';
import type { ConversionContext } from '../../src/types';

// Helper to create a mock conversion state
function createMockState(overrides?: Partial<ConversionState>): ConversionState {
	const context: ConversionContext = {
		imageMode: 'upload',
		downloadRemoteImages: false,
		images: [],
	};

	return {
		context,
		existingFilenames: new Set<string>(),
		convertNode: (node: MdastNode) => `[node:${node.type}]`,
		convertChildren: (parent: Parent) => {
			const children = (parent as { children?: MdastNode[] }).children || [];
			return children.map((c) => `[child:${c.type}]`).join('');
		},
		...overrides,
	};
}

describe('converter/handlers', () => {
	describe('createHandlerRegistry', () => {
		it('should create a registry with all node types', () => {
			const registry = createHandlerRegistry();

			// Text handlers
			expect(registry.has('text')).toBe(true);
			expect(registry.has('strong')).toBe(true);
			expect(registry.has('emphasis')).toBe(true);
			expect(registry.has('delete')).toBe(true);
			expect(registry.has('inlineCode')).toBe(true);

			// Structure handlers
			expect(registry.has('heading')).toBe(true);
			expect(registry.has('paragraph')).toBe(true);
			expect(registry.has('blockquote')).toBe(true);
			expect(registry.has('thematicBreak')).toBe(true);
			expect(registry.has('break')).toBe(true);
			expect(registry.has('html')).toBe(true);

			// List handlers
			expect(registry.has('list')).toBe(true);
			expect(registry.has('listItem')).toBe(true);

			// Code handler
			expect(registry.has('code')).toBe(true);

			// Table handlers
			expect(registry.has('table')).toBe(true);
			expect(registry.has('tableRow')).toBe(true);
			expect(registry.has('tableCell')).toBe(true);

			// Link/image handlers
			expect(registry.has('link')).toBe(true);
			expect(registry.has('image')).toBe(true);
		});

		it('should return the same handler functions', () => {
			const registry = createHandlerRegistry();
			expect(registry.get('text')).toBe(textHandler);
			expect(registry.get('heading')).toBe(headingHandler);
			expect(registry.get('code')).toBe(codeHandler);
		});
	});

	describe('text handlers', () => {
		it('textHandler should escape XML', () => {
			const state = createMockState();
			const node = { type: 'text', value: 'Hello <world> & "test"' } as MdastNode;
			expect(textHandler(node, state)).toBe('Hello &lt;world&gt; &amp; &quot;test&quot;');
		});

		it('strongHandler should wrap in <strong>', () => {
			const state = createMockState();
			const node = { type: 'strong', children: [{ type: 'text', value: 'bold' }] } as MdastNode;
			expect(strongHandler(node, state)).toBe('<strong>[child:text]</strong>');
		});

		it('emphasisHandler should wrap in <em>', () => {
			const state = createMockState();
			const node = { type: 'emphasis', children: [{ type: 'text', value: 'italic' }] } as MdastNode;
			expect(emphasisHandler(node, state)).toBe('<em>[child:text]</em>');
		});

		it('deleteHandler should wrap in <del>', () => {
			const state = createMockState();
			const node = {
				type: 'delete',
				children: [{ type: 'text', value: 'strikethrough' }],
			} as MdastNode;
			expect(deleteHandler(node, state)).toBe('<del>[child:text]</del>');
		});

		it('inlineCodeHandler should wrap in <code> and escape', () => {
			const state = createMockState();
			const node = { type: 'inlineCode', value: '<script>' } as MdastNode;
			expect(inlineCodeHandler(node, state)).toBe('<code>&lt;script&gt;</code>');
		});
	});

	describe('structure handlers', () => {
		it('headingHandler should create h1-h6 tags', () => {
			const state = createMockState();
			// Empty elements use self-closing tags
			expect(headingHandler({ type: 'heading', depth: 1, children: [] } as MdastNode, state)).toBe(
				'<h1/>'
			);
			expect(headingHandler({ type: 'heading', depth: 2, children: [] } as MdastNode, state)).toBe(
				'<h2/>'
			);
			expect(headingHandler({ type: 'heading', depth: 6, children: [] } as MdastNode, state)).toBe(
				'<h6/>'
			);
		});

		it('headingHandler should clamp depth to 1-6', () => {
			const state = createMockState();
			expect(headingHandler({ type: 'heading', depth: 0, children: [] } as MdastNode, state)).toBe(
				'<h1/>'
			);
			expect(headingHandler({ type: 'heading', depth: 10, children: [] } as MdastNode, state)).toBe(
				'<h6/>'
			);
		});

		it('paragraphHandler should create <p> tag', () => {
			const state = createMockState();
			const node = { type: 'paragraph', children: [] } as MdastNode;
			// Empty elements use self-closing tags
			expect(paragraphHandler(node, state)).toBe('<p/>');
		});

		it('blockquoteHandler should create <blockquote> tag', () => {
			const state = createMockState();
			const node = { type: 'blockquote', children: [] } as MdastNode;
			// Empty elements use self-closing tags
			expect(blockquoteHandler(node, state)).toBe('<blockquote/>');
		});

		it('thematicBreakHandler should return <hr/>', () => {
			const state = createMockState();
			expect(thematicBreakHandler({ type: 'thematicBreak' } as MdastNode, state)).toBe('<hr/>');
		});

		it('breakHandler should return <br/>', () => {
			const state = createMockState();
			expect(breakHandler({ type: 'break' } as MdastNode, state)).toBe('<br/>');
		});

		it('htmlHandler should return empty string (stripped)', () => {
			const state = createMockState();
			expect(htmlHandler({ type: 'html', value: '<div>test</div>' } as MdastNode, state)).toBe('');
		});
	});

	describe('list handlers', () => {
		it('listHandler should create <ul> for unordered list', () => {
			const state = createMockState();
			const node = { type: 'list', ordered: false, children: [{ type: 'listItem' }] } as MdastNode;
			expect(listHandler(node, state)).toBe('<ul>[node:listItem]</ul>');
		});

		it('listHandler should create <ol> for ordered list', () => {
			const state = createMockState();
			const node = { type: 'list', ordered: true, children: [{ type: 'listItem' }] } as MdastNode;
			expect(listHandler(node, state)).toBe('<ol>[node:listItem]</ol>');
		});

		it('listItemHandler should create <li> tag', () => {
			const state = createMockState({
				convertChildren: () => 'content',
			});
			const node = { type: 'listItem', children: [{ type: 'paragraph' }] } as MdastNode;
			expect(listItemHandler(node, state)).toBe('<li>content</li>');
		});

		it('listItemHandler should add checkbox for task list', () => {
			const state = createMockState({
				convertChildren: () => 'task',
			});
			const unchecked = {
				type: 'listItem',
				checked: false,
				children: [{ type: 'paragraph' }],
			} as MdastNode;
			const checked = {
				type: 'listItem',
				checked: true,
				children: [{ type: 'paragraph' }],
			} as MdastNode;

			expect(listItemHandler(unchecked, state)).toBe('<li>[ ] task</li>');
			expect(listItemHandler(checked, state)).toBe('<li>[x] task</li>');
		});
	});

	describe('code handler', () => {
		it('codeHandler should create code macro', () => {
			const state = createMockState();
			const node = { type: 'code', lang: 'javascript', value: 'const x = 1;' } as MdastNode;
			const result = codeHandler(node, state);

			expect(result).toContain('ac:name="code"');
			expect(result).toContain('ac:name="language"');
			expect(result).toContain('javascript');
			expect(result).toContain('const x = 1;');
		});

		it('codeHandler should handle mermaid language', () => {
			const state = createMockState();
			const node = { type: 'code', lang: 'mermaid', value: 'graph LR; A-->B' } as MdastNode;
			const result = codeHandler(node, state);

			expect(result).toContain('ac:name="mermaid"');
			expect(result).toContain('graph LR; A-->B');
		});

		it('codeHandler should handle code without language', () => {
			const state = createMockState();
			const node = { type: 'code', value: 'plain text' } as MdastNode;
			const result = codeHandler(node, state);

			expect(result).toContain('ac:name="code"');
			expect(result).not.toContain('ac:name="language"');
		});
	});

	describe('table handlers', () => {
		it('tableHandler should create table with thead and tbody', () => {
			const state = createMockState({
				convertChildren: () => 'cell content',
			});
			const node = {
				type: 'table',
				children: [
					{ type: 'tableRow', children: [{ type: 'tableCell' }] },
					{ type: 'tableRow', children: [{ type: 'tableCell' }] },
				],
			} as MdastNode;

			const result = tableHandler(node, state);
			expect(result).toContain('<table>');
			expect(result).toContain('<thead>');
			expect(result).toContain('<tbody>');
			expect(result).toContain('<th>');
			expect(result).toContain('<td>');
		});

		it('tableHandler should handle empty table', () => {
			const state = createMockState();
			const node = { type: 'table', children: [] } as MdastNode;
			expect(tableHandler(node, state)).toBe('');
		});

		it('tableRowHandler should create <tr>', () => {
			const state = createMockState({
				convertChildren: () => 'content',
			});
			const node = { type: 'tableRow', children: [{ type: 'tableCell' }] } as MdastNode;
			const result = tableRowHandler(node, state);
			expect(result).toContain('<tr>');
			expect(result).toContain('<td>');
		});

		it('tableCellHandler should create <td>', () => {
			const state = createMockState({
				convertChildren: () => 'cell',
			});
			const node = { type: 'tableCell', children: [] } as MdastNode;
			expect(tableCellHandler(node, state)).toBe('<td>cell</td>');
		});

		it('tableCellHandler should preserve <br> HTML inside cells', () => {
			const state = createMockState({
				convertNode: (node) => {
					if (node.type === 'text') {
						return node.value ?? '';
					}
					return '';
				},
			});
			const node = {
				type: 'tableCell',
				children: [
					{ type: 'text', value: 'foo' },
					{ type: 'html', value: '<br>' },
					{ type: 'text', value: 'bar' },
				],
			} as MdastNode;

			expect(tableCellHandler(node, state)).toBe('<td>foo<br/>bar</td>');
		});

		it('tableCellHandler should strip non-break HTML inside cells', () => {
			const state = createMockState({
				convertNode: (node) => {
					if (node.type === 'text') {
						return node.value ?? '';
					}
					return '';
				},
			});
			const node = {
				type: 'tableCell',
				children: [
					{ type: 'html', value: '<span>' },
					{ type: 'text', value: 'foo' },
					{ type: 'html', value: '</span>' },
				],
			} as MdastNode;

			expect(tableCellHandler(node, state)).toBe('<td>foo</td>');
		});
	});

	describe('link and image handlers', () => {
		it('linkHandler should create <a> tag with href', () => {
			const state = createMockState();
			const node = { type: 'link', url: 'https://example.com', children: [] } as MdastNode;
			const result = linkHandler(node, state);

			expect(result).toContain('<a');
			expect(result).toContain('href="https://example.com"');
		});

		it('linkHandler should include title if present', () => {
			const state = createMockState();
			const node = {
				type: 'link',
				url: 'https://example.com',
				title: 'Link Title',
				children: [],
			} as MdastNode;
			const result = linkHandler(node, state);

			expect(result).toContain('title="Link Title"');
		});

		it('imageHandler should create attachment image for local files', () => {
			const state = createMockState();
			const node = { type: 'image', url: 'images/photo.png', alt: 'Photo' } as MdastNode;
			const result = imageHandler(node, state);

			expect(result).toContain('ri:filename="photo.png"');
			expect(result).toContain('ac:alt="Photo"');
			expect(state.context.images).toHaveLength(1);
		});

		it('imageHandler should create URL image for remote files', () => {
			const state = createMockState();
			const node = { type: 'image', url: 'https://example.com/image.png' } as MdastNode;
			const result = imageHandler(node, state);

			expect(result).toContain('ri:value="https://example.com/image.png"');
		});

		it('imageHandler should download remote images when enabled', () => {
			const state = createMockState({
				context: {
					imageMode: 'upload',
					downloadRemoteImages: true,
					images: [],
				},
			});
			const node = { type: 'image', url: 'https://example.com/image.png' } as MdastNode;
			const result = imageHandler(node, state);

			expect(result).toContain('ri:filename="image.png"');
			expect(state.context.images[0].attachmentFilename).toBe('image.png');
		});

		it('imageHandler should handle filename collisions', () => {
			const existingFilenames = new Set(['logo.png']);
			const state = createMockState({ existingFilenames });
			const node = { type: 'image', url: 'assets/logo.png' } as MdastNode;
			const result = imageHandler(node, state);

			expect(result).toContain('ri:filename="logo_1.png"');
		});
	});
});
