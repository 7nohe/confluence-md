/**
 * Text-related node handlers
 */

import type { InlineCode, Text } from 'mdast';
import type { Parent } from 'unist';
import { createElement, escapeXml } from '../xml';
import type { NodeHandler } from './types';

/**
 * Handle plain text nodes
 */
export const textHandler: NodeHandler = (node) => {
	return escapeXml((node as unknown as Text).value);
};

/**
 * Handle strong/bold text
 */
export const strongHandler: NodeHandler = (node, state) => {
	return createElement('strong', undefined, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle emphasis/italic text
 */
export const emphasisHandler: NodeHandler = (node, state) => {
	return createElement('em', undefined, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle strikethrough text
 */
export const deleteHandler: NodeHandler = (node, state) => {
	return createElement('del', undefined, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle inline code
 */
export const inlineCodeHandler: NodeHandler = (node) => {
	return createElement('code', undefined, escapeXml((node as unknown as InlineCode).value));
};
