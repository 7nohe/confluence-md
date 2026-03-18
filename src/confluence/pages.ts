/**
 * Confluence page operations
 */

import { getLogger } from '../logger';
import type {
	ConfluencePage,
	ConfluencePageCreate,
	ConfluencePageUpdate,
	ConfluenceSpaceResult,
} from '../types';
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
 * Resolve a space key to a space ID
 */
export async function resolveSpaceId(client: ConfluenceClient, spaceKey: string): Promise<string> {
	getLogger().info(`Resolving space key: ${spaceKey}...`);

	const result = await client.get<ConfluenceSpaceResult>(
		`/wiki/api/v2/spaces?keys=${encodeURIComponent(spaceKey)}&limit=1`
	);

	if (!result.results || result.results.length === 0) {
		throw new Error(`Space not found: ${spaceKey}`);
	}

	const spaceId = result.results[0].id;
	getLogger().debug(`Resolved space ${spaceKey} to ID ${spaceId}`);

	return spaceId;
}

/**
 * Create a new page in a space
 */
export async function createPage(
	client: ConfluenceClient,
	title: string,
	spaceId: string,
	storage: string,
	parentPageId?: string
): Promise<ConfluencePage> {
	getLogger().info(`Creating page "${title}" in space ${spaceId}...`);

	const createBody: ConfluencePageCreate = {
		spaceId,
		status: 'current',
		title,
		body: {
			representation: 'storage',
			value: storage,
		},
	};

	if (parentPageId) {
		createBody.parentId = parentPageId;
	}

	const createdPage = await client.post<ConfluencePage>('/wiki/api/v2/pages', createBody);

	getLogger().info(
		`Page created successfully. ID: ${createdPage.id}, Version: ${createdPage.version.number}`
	);

	return createdPage;
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
