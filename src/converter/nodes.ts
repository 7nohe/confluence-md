/**
 * Markdown AST node converters for Confluence storage format
 *
 * Uses a handler registry pattern for extensibility and maintainability.
 */

import type { Parent } from 'unist';
import type { ConversionContext } from '../types';
import { type ConversionState, createHandlerRegistry, type MdastNode } from './handlers';

// Create a singleton handler registry
const registry = createHandlerRegistry();

/**
 * Convert a single node to Confluence storage format
 */
export function convertNode(
	node: MdastNode,
	context: ConversionContext,
	existingFilenames: Set<string>
): string {
	// Create state for this conversion
	const state: ConversionState = {
		context,
		existingFilenames,
		convertNode: (n: MdastNode) => convertNode(n, context, existingFilenames),
		convertChildren: (p: Parent) => convertChildren(p, context, existingFilenames),
	};

	// Handle root node
	if (node.type === 'root') {
		return state.convertChildren(node as unknown as Parent);
	}

	// Look up handler in registry
	const handler = registry.get(node.type);
	if (handler) {
		return handler(node, state);
	}

	// Fallback: try to convert children if they exist
	if (node.children) {
		return state.convertChildren(node as unknown as Parent);
	}

	// Unknown node with no children
	return '';
}

/**
 * Convert all children of a parent node
 */
export function convertChildren(
	parent: Parent,
	context: ConversionContext,
	existingFilenames: Set<string>
): string {
	if (!parent.children) {
		return '';
	}
	return parent.children
		.map((child) => convertNode(child as MdastNode, context, existingFilenames))
		.join('');
}
