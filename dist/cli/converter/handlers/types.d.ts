/**
 * Type definitions for node handlers
 */
import type { Node, Parent } from 'unist';
import type { ConversionContext } from '../../types';
/**
 * Extended Mdast node type with all possible properties
 */
export type MdastNode = Node & {
    type: string;
    children?: MdastNode[];
    value?: string;
    depth?: number;
    ordered?: boolean;
    start?: number;
    checked?: boolean | null;
    lang?: string | null;
    meta?: string | null;
    url?: string;
    title?: string | null;
    alt?: string;
    align?: Array<'left' | 'center' | 'right' | null>;
};
/**
 * State passed to each handler for recursive conversion
 */
export interface ConversionState {
    /** Current conversion context */
    context: ConversionContext;
    /** Set of already used filenames (for collision handling) */
    existingFilenames: Set<string>;
    /** Convert a single node (for recursive calls) */
    convertNode: (node: MdastNode) => string;
    /** Convert all children of a parent node */
    convertChildren: (parent: Parent) => string;
}
/**
 * Handler function type for converting a specific node type
 */
export type NodeHandler = (node: MdastNode, state: ConversionState) => string;
/**
 * Registry mapping node types to their handlers
 */
export type HandlerRegistry = Map<string, NodeHandler>;
//# sourceMappingURL=types.d.ts.map