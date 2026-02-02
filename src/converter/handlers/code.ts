/**
 * Code block handlers
 */

import type { Code } from 'mdast';
import { createMacro } from '../xml';
import type { NodeHandler } from './types';

/**
 * Handle code block nodes (including mermaid)
 */
export const codeHandler: NodeHandler = (node) => {
	const code = node as unknown as Code;
	const lang = code.lang || '';
	const value = code.value || '';

	// Handle Mermaid diagrams
	if (lang.toLowerCase() === 'mermaid') {
		return createMacro('mermaid', undefined, value, 'plain-text');
	}

	// Regular code block with optional language parameter
	const params = lang ? { language: lang } : undefined;
	return createMacro('code', params, value, 'plain-text');
};
