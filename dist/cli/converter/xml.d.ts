/**
 * XML utility functions for Confluence storage format
 */
/**
 * Escape special XML characters in text content
 */
export declare function escapeXml(text: string): string;
/**
 * Escape special XML characters in attribute values
 */
export declare function escapeAttribute(value: string): string;
/**
 * Wrap content in CDATA section for use in macro bodies
 * Handles nested CDATA by splitting ]]> sequences
 */
export declare function wrapCData(content: string): string;
/**
 * Create an XML element with optional attributes and content
 */
export declare function createElement(tag: string, attributes?: Record<string, string>, content?: string): string;
/**
 * Create a Confluence structured macro element
 */
export declare function createMacro(name: string, parameters?: Record<string, string>, body?: string, bodyType?: 'plain-text' | 'rich-text'): string;
/**
 * Create a Confluence image element
 */
export declare function createImage(source: {
    type: 'attachment';
    filename: string;
} | {
    type: 'url';
    url: string;
}, alt?: string, title?: string): string;
//# sourceMappingURL=xml.d.ts.map