import * as path from 'node:path';
import * as core from '@actions/core';
import type { ActionInputs } from './types';

export function getInputs(): ActionInputs {
	const source = core.getInput('source', { required: true });
	const attachmentsBaseInput = core.getInput('attachments_base');
	const attachmentsBase = attachmentsBaseInput || path.dirname(source);
	const imageMode = validateImageMode(core.getInput('image_mode') || 'upload');

	const inputs: ActionInputs = {
		confluenceBaseUrl: normalizeBaseUrl(core.getInput('confluence_base_url', { required: true })),
		pageId: core.getInput('page_id') || undefined,
		email: core.getInput('email', { required: true }),
		apiToken: core.getInput('api_token', { required: true }),
		source,
		attachmentsBase,
		attachmentsBaseProvided: attachmentsBaseInput !== '',
		titleOverride: core.getInput('title_override') || undefined,
		frontmatterPageIdKey: core.getInput('frontmatter_page_id_key') || 'confluence_page_id',
		imageMode,
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

function validateImageMode(mode: string): 'upload' | 'external' {
	if (mode !== 'upload' && mode !== 'external') {
		throw new Error(`Invalid image_mode: ${mode}. Must be 'upload' or 'external'.`);
	}
	return mode;
}

export class PageIdNotFoundError extends Error {
	constructor(frontmatterKey: string) {
		super(
			`Page ID not found. Please provide it via the 'page_id' input or in frontmatter using the key '${frontmatterKey}'.`
		);
		this.name = 'PageIdNotFoundError';
	}
}

export function validateInputs(
	inputs: ActionInputs,
	pageIdFromFrontmatter?: string,
	options?: { allowInputFallback?: boolean }
): string {
	const allowInputFallback = options?.allowInputFallback ?? true;
	const pageId = pageIdFromFrontmatter || (allowInputFallback ? inputs.pageId : undefined);

	if (!pageId) {
		throw new PageIdNotFoundError(inputs.frontmatterPageIdKey);
	}

	return pageId;
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
	attachmentsBase?: string;
	titleOverride?: string;
	frontmatterPageIdKey?: string;
	imageMode?: string;
	downloadRemoteImages?: boolean;
	skipIfUnchanged?: boolean;
	dryRun?: boolean;
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
		email: raw.email,
		apiToken: raw.apiToken,
		source: raw.source,
		attachmentsBase: raw.attachmentsBase || path.dirname(raw.source),
		attachmentsBaseProvided: raw.attachmentsBase !== undefined,
		titleOverride: raw.titleOverride || undefined,
		frontmatterPageIdKey: raw.frontmatterPageIdKey || 'confluence_page_id',
		imageMode,
		downloadRemoteImages: raw.downloadRemoteImages ?? false,
		skipIfUnchanged: raw.skipIfUnchanged ?? true,
		dryRun: raw.dryRun ?? false,
		notifyWatchers: raw.notifyWatchers ?? false,
		userAgent: raw.userAgent || 'confluence-md-cli',
	};
}
