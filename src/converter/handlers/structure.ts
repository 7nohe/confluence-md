/**
 * Structure-related node handlers (headings, paragraphs, etc.)
 */

import type { Blockquote, Heading } from 'mdast';
import type { Parent } from 'unist';
import { createElement } from '../xml';
import type { NodeHandler } from './types';

/**
 * Handle heading nodes (h1-h6)
 */
export const headingHandler: NodeHandler = (node, state) => {
	const heading = node as unknown as Heading;
	const level = Math.min(Math.max(heading.depth, 1), 6);
	const tag = `h${level}`;
	return createElement(tag, undefined, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle paragraph nodes
 */
export const paragraphHandler: NodeHandler = (node, state) => {
	return createElement('p', undefined, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle blockquote nodes
 */
export const blockquoteHandler: NodeHandler = (node, state) => {
	return createElement(
		'blockquote',
		undefined,
		state.convertChildren(node as unknown as Blockquote)
	);
};

/**
 * Handle horizontal rule
 */
export const thematicBreakHandler: NodeHandler = () => '<hr/>';

/**
 * Handle line break
 */
export const breakHandler: NodeHandler = () => '<br/>';

/**
 * Handle HTML nodes (stripped for security)
 */
export const htmlHandler: NodeHandler = () => '';
