import * as path from 'node:path';
import * as core from '@actions/core';
import type { ActionInputs, PageTarget } from './types';

export function getInputs(): ActionInputs {
	const source = core.getInput('source', { required: true });
	const attachmentsBaseInput = core.getInput('attachments_base');
	const attachmentsBase = attachmentsBaseInput || path.dirname(source);
	const imageMode = validateImageMode(core.getInput('image_mode') || 'upload');

	const inputs: ActionInputs = {
		confluenceBaseUrl: normalizeBaseUrl(core.getInput('confluence_base_url', { required: true })),
		pageId: core.getInput('page_id') || undefined,
		spaceKey: core.getInput('space_key') || undefined,
		parentPageId: core.getInput('parent_page_id') || undefined,
		writePageId: core.getInput('write_page_id') === 'true',
		email: core.getInput('email', { required: true }),
		apiToken: core.getInput('api_token', { required: true }),
		source,
		attachmentsBase,
		attachmentsBaseProvided: attachmentsBaseInput !== '',
		titleOverride: core.getInput('title_override') || undefined,
		frontmatterPageIdKey: core.getInput('frontmatter_page_id_key') || 'confluence_page_id',
		imageMode,
		exclude: parseExcludePatterns(core.getInput('exclude')),
		downloadRemoteImages: core.getBooleanInput('download_remote_images'),
		skipIfUnchanged: core.getBooleanInput('skip_if_unchanged'),
		dryRun: core.getBooleanInput('dry_run'),
		notifyWatchers: core.getBooleanInput('notify_watchers'),
		userAgent: core.getInput('user_agent') || 'confluence-md',
	};

	// Mask sensitive values
	core.setSecret(inputs.apiToken);

	return inputs;
}

function normalizeBaseUrl(url: string): string {
	// Remove trailing slash if present
	return url.replace(/\/+$/, '');
}

export function parseExcludePatterns(input: string): string[] {
	if (!input.trim()) return [];
	return input
		.split(/[,\n]/)
		.map((p) => p.trim())
		.filter((p) => p !== '');
}

function validateImageMode(mode: string): 'upload' | 'external' {
	if (mode !== 'upload' && mode !== 'external') {
		throw new Error(`Invalid image_mode: ${mode}. Must be 'upload' or 'external'.`);
	}
	return mode;
}

export class PageIdNotFoundError extends Error {
	constructor(frontmatterKey: string) {
		super(
			`Page ID not found. Provide 'page_id', frontmatter '${frontmatterKey}', or 'space_key' to create a new page.`
		);
		this.name = 'PageIdNotFoundError';
	}
}

export function resolvePageTarget(
	inputs: ActionInputs,
	pageIdFromFrontmatter?: string,
	options?: { allowInputFallback?: boolean }
): PageTarget {
	const allowInputFallback = options?.allowInputFallback ?? true;
	const pageId = pageIdFromFrontmatter || (allowInputFallback ? inputs.pageId : undefined);
	if (pageId) {
		return { mode: 'update', pageId };
	}
	if (inputs.spaceKey) {
		return { mode: 'create', spaceKey: inputs.spaceKey, parentPageId: inputs.parentPageId };
	}
	throw new PageIdNotFoundError(inputs.frontmatterPageIdKey);
}

/**
 * Raw inputs from CLI or config file
 * Used to create ActionInputs without @actions/core dependency
 */
export interface RawInputs {
	confluenceBaseUrl: string;
	email: string;
	apiToken: string;
	source: string;
	pageId?: string;
	spaceKey?: string;
	parentPageId?: string;
	writePageId?: boolean;
	attachmentsBase?: string;
	titleOverride?: string;
	frontmatterPageIdKey?: string;
	imageMode?: string;
	downloadRemoteImages?: boolean;
	skipIfUnchanged?: boolean;
	dryRun?: boolean;
	exclude?: string[] | string;
	notifyWatchers?: boolean;
	userAgent?: string;
}

/**
 * Create ActionInputs from raw values (CLI/config file)
 */
export function createInputsFromRaw(raw: RawInputs): ActionInputs {
	const imageMode = validateImageMode(raw.imageMode || 'upload');

	return {
		confluenceBaseUrl: normalizeBaseUrl(raw.confluenceBaseUrl),
		pageId: raw.pageId || undefined,
		spaceKey: raw.spaceKey || undefined,
		parentPageId: raw.parentPageId || undefined,
		writePageId: raw.writePageId ?? false,
		email: raw.email,
		apiToken: raw.apiToken,
		source: raw.source,
		attachmentsBase: raw.attachmentsBase || path.dirname(raw.source),
		attachmentsBaseProvided: raw.attachmentsBase !== undefined,
		titleOverride: raw.titleOverride || undefined,
		frontmatterPageIdKey: raw.frontmatterPageIdKey || 'confluence_page_id',
		imageMode,
		exclude: Array.isArray(raw.exclude)
			? raw.exclude
			: parseExcludePatterns(raw.exclude || ''),
		downloadRemoteImages: raw.downloadRemoteImages ?? false,
		skipIfUnchanged: raw.skipIfUnchanged ?? true,
		dryRun: raw.dryRun ?? false,
		notifyWatchers: raw.notifyWatchers ?? false,
		userAgent: raw.userAgent || 'confluence-md-cli',
	};
}
