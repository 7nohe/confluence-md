/**
 * Markdown to Confluence storage format converter
 */

import type { Root } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { ConversionContext, ConversionResult } from '../types';
import type { MdastNode } from './handlers/types';
import { convertNode } from './nodes';

export interface ConvertOptions {
	attachmentsBase: string;
	imageMode: 'upload' | 'external';
	downloadRemoteImages: boolean;
}

/**
 * Convert Markdown content to Confluence storage format
 */
export function convertMarkdown(markdown: string, options: ConvertOptions): ConversionResult {
	// Parse Markdown to AST
	const processor = unified().use(remarkParse).use(remarkGfm);
	const tree = processor.parse(markdown) as Root;

	// Create conversion context
	const context: ConversionContext = {
		attachmentsBase: options.attachmentsBase,
		imageMode: options.imageMode,
		downloadRemoteImages: options.downloadRemoteImages,
		images: [],
	};

	// Track existing filenames to handle collisions
	const existingFilenames = new Set<string>();

	// Convert AST to Confluence storage format
	const storage = convertNode(tree as unknown as MdastNode, context, existingFilenames);

	return {
		storage,
		images: context.images,
	};
}

/**
 * Re-export utilities for external use
 */
export {
	createElement,
	createImage,
	createMacro,
	escapeAttribute,
	escapeXml,
	wrapCData,
} from './xml';
