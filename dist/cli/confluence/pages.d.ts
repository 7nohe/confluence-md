/**
 * Confluence page operations
 */
import type { ConfluencePage } from '../types';
import type { ConfluenceClient } from './client';
/**
 * Get a page by ID with storage format body
 */
export declare function getPage(client: ConfluenceClient, pageId: string): Promise<ConfluencePage>;
/**
 * Update a page with new content
 */
export declare function updatePage(client: ConfluenceClient, pageId: string, title: string, storage: string, currentVersion: number, versionMessage?: string): Promise<ConfluencePage>;
/**
 * Build the page URL from page data
 */
export declare function buildPageUrl(baseUrl: string, page: ConfluencePage): string;
//# sourceMappingURL=pages.d.ts.map