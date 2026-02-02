/**
 * List-related node handlers
 */

import type { List, ListItem } from 'mdast';
import type { Parent } from 'unist';
import { createElement } from '../xml';
import type { MdastNode, NodeHandler } from './types';

/**
 * Handle list nodes (ordered and unordered)
 */
export const listHandler: NodeHandler = (node, state) => {
	const list = node as unknown as List;
	const tag = list.ordered ? 'ol' : 'ul';
	const children = list.children.map((child) => state.convertNode(child as MdastNode)).join('');
	return createElement(tag, undefined, children);
};

/**
 * Handle list item nodes
 */
export const listItemHandler: NodeHandler = (node, state) => {
	const listItem = node as unknown as ListItem;
	let content = '';

	// Handle task list items with text fallback
	if (listItem.checked !== null && listItem.checked !== undefined) {
		const checkbox = listItem.checked ? '[x] ' : '[ ] ';
		content = checkbox;
	}

	// Convert children, handling paragraph unwrapping for simple items
	if (listItem.children) {
		const childContent = listItem.children
			.map((child) => {
				const childNode = child as MdastNode;
				// Unwrap single paragraph inside list item
				if (childNode.type === 'paragraph' && listItem.children?.length === 1) {
					return state.convertChildren(childNode as Parent);
				}
				return state.convertNode(childNode);
			})
			.join('');
		content += childContent;
	}

	return createElement('li', undefined, content);
};
