/**
 * Markdown to Confluence storage format converter
 */
import type { ConversionResult } from '../types';
export interface ConvertOptions {
    attachmentsBase: string;
    imageMode: 'upload' | 'external';
    downloadRemoteImages: boolean;
}
/**
 * Convert Markdown content to Confluence storage format
 */
export declare function convertMarkdown(markdown: string, options: ConvertOptions): ConversionResult;
/**
 * Re-export utilities for external use
 */
export { createElement, createImage, createMacro, escapeAttribute, escapeXml, wrapCData, } from './xml';
//# sourceMappingURL=index.d.ts.map