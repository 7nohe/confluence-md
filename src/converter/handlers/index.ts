/**
 * Handler registry - maps node types to their handlers
 */

import { codeHandler } from './code';
import { imageHandler, linkHandler } from './link';
import { listHandler, listItemHandler } from './list';
import {
	blockquoteHandler,
	breakHandler,
	headingHandler,
	htmlHandler,
	paragraphHandler,
	thematicBreakHandler,
} from './structure';
import { tableCellHandler, tableHandler, tableRowHandler } from './table';
import {
	deleteHandler,
	emphasisHandler,
	inlineCodeHandler,
	strongHandler,
	textHandler,
} from './text';
import type { HandlerRegistry, NodeHandler } from './types';

/** All node type handlers */
const handlers: Record<string, NodeHandler> = {
	// Text/inline
	text: textHandler,
	strong: strongHandler,
	emphasis: emphasisHandler,
	delete: deleteHandler,
	inlineCode: inlineCodeHandler,
	// Structure
	heading: headingHandler,
	paragraph: paragraphHandler,
	blockquote: blockquoteHandler,
	thematicBreak: thematicBreakHandler,
	break: breakHandler,
	html: htmlHandler,
	// Lists
	list: listHandler,
	listItem: listItemHandler,
	// Code
	code: codeHandler,
	// Tables
	table: tableHandler,
	tableRow: tableRowHandler,
	tableCell: tableCellHandler,
	// Links/images
	link: linkHandler,
	image: imageHandler,
};

/** Create a handler registry with all node type handlers */
export function createHandlerRegistry(): HandlerRegistry {
	return new Map(Object.entries(handlers));
}

// Re-export types for convenience
export type { ConversionState, HandlerRegistry, MdastNode, NodeHandler } from './types';
