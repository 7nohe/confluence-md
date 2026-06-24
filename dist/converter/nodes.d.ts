/**
 * Markdown AST node converters for Confluence storage format
 *
 * Uses a handler registry pattern for extensibility and maintainability.
 */
import type { Parent } from 'unist';
import type { ConversionContext } from '../types';
import { type MdastNode } from './handlers';
/**
 * Convert a single node to Confluence storage format
 */
export declare function convertNode(node: MdastNode, context: ConversionContext, existingFilenames: Set<string>): string;
/**
 * Convert all children of a parent node
 */
export declare function convertChildren(parent: Parent, context: ConversionContext, existingFilenames: Set<string>): string;
//# sourceMappingURL=nodes.d.ts.map