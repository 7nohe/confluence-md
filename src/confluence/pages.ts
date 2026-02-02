/**
 * Confluence page operations
 */

import { getLogger } from '../logger';
import type { ConfluencePage, ConfluencePageUpdate } from '../types';
import type { ConfluenceClient } from './client';

/**
 * Get a page by ID with storage format body
 */
export async function getPage(client: ConfluenceClient, pageId: string): Promise<ConfluencePage> {
	getLogger().info(`Fetching page ${pageId}...`);

	const page = await client.get<ConfluencePage>(`/wiki/api/v2/pages/${pageId}?body-format=storage`);

	getLogger().debug(`Page title: ${page.title}`);
	getLogger().debug(`Page version: ${page.version.number}`);

	return page;
}

/**
 * Update a page with new content
 */
export async function updatePage(
	client: ConfluenceClient,
	pageId: string,
	title: string,
	storage: string,
	currentVersion: number,
	versionMessage?: string
): Promise<ConfluencePage> {
	getLogger().info(`Updating page ${pageId} to version ${currentVersion + 1}...`);

	const updateBody: ConfluencePageUpdate = {
		id: pageId,
		status: 'current',
		title,
		body: {
			representation: 'storage',
			value: storage,
		},
		version: {
			number: currentVersion + 1,
			message: versionMessage || 'Updated by confluence-md',
		},
	};

	const updatedPage = await client.put<ConfluencePage>(`/wiki/api/v2/pages/${pageId}`, updateBody);

	getLogger().info(`Page updated successfully. New version: ${updatedPage.version.number}`);

	return updatedPage;
}

/**
 * Build the page URL from page data
 */
export function buildPageUrl(baseUrl: string, page: ConfluencePage): string {
	if (page._links?.webui) {
		const base = page._links.base || baseUrl;
		return `${base}${page._links.webui}`;
	}
	// Fallback URL format
	return `${baseUrl}/wiki/spaces/~/${page.id}`;
}
