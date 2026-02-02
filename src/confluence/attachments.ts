/**
 * Confluence attachment operations
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { HttpClient } from '@actions/http-client';
import { getLogger } from '../logger';
import type { ConfluenceAttachment, ImageReference } from '../types';
import type { ConfluenceClient } from './client';

/**
 * MIME type mapping based on file extension
 */
const MIME_TYPES: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.bmp': 'image/bmp',
	'.ico': 'image/x-icon',
	'.pdf': 'application/pdf',
};

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
	const ext = path.extname(filename).toLowerCase();
	return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Upload an attachment to a page
 */
export async function uploadAttachment(
	client: ConfluenceClient,
	pageId: string,
	filename: string,
	content: Buffer
): Promise<ConfluenceAttachment> {
	getLogger().info(`Uploading attachment: ${filename}`);

	const mimeType = getMimeType(filename);

	// Use v1 API for attachments (v2 doesn't support multipart upload well)
	const result = await client.postMultipart<{ results: ConfluenceAttachment[] }>(
		`/wiki/rest/api/content/${pageId}/child/attachment`,
		filename,
		content,
		mimeType
	);

	if (result.results && result.results.length > 0) {
		getLogger().debug(`Attachment uploaded: ${result.results[0].id}`);
		return result.results[0];
	}

	throw new Error(`Failed to upload attachment: ${filename}`);
}

/**
 * Upload multiple attachments from image references
 */
export async function uploadAttachments(
	client: ConfluenceClient,
	pageId: string,
	images: ImageReference[],
	attachmentsBase: string
): Promise<number> {
	let uploadedCount = 0;

	for (const image of images) {
		if (!image.attachmentFilename) {
			continue;
		}

		try {
			let content: Buffer;

			if (image.isRemote && image.src) {
				// Download remote image
				getLogger().debug(`Downloading remote image: ${image.src}`);
				content = await downloadImage(image.src);
			} else {
				// Read local file
				const localPath = path.resolve(attachmentsBase, image.src);
				getLogger().debug(`Reading local image: ${localPath}`);

				// Security check: ensure path is within attachmentsBase
				const resolvedBase = path.resolve(attachmentsBase);
				if (!localPath.startsWith(resolvedBase)) {
					throw new Error(`Path traversal detected: ${image.src}`);
				}

				if (!fs.existsSync(localPath)) {
					getLogger().warning(`Image not found: ${localPath}`);
					continue;
				}

				content = fs.readFileSync(localPath);
			}

			await uploadAttachment(client, pageId, image.attachmentFilename, content);
			uploadedCount++;
		} catch (error) {
			getLogger().warning(
				`Failed to upload image ${image.src}: ${error instanceof Error ? error.message : error}`
			);
		}
	}

	return uploadedCount;
}

/**
 * Download an image from a URL
 */
async function downloadImage(url: string): Promise<Buffer> {
	const http = new HttpClient('confluence-md');
	const response = await http.get(url);

	if (response.message.statusCode !== 200) {
		throw new Error(`Failed to download image: HTTP ${response.message.statusCode}`);
	}

	if (!response.readBodyBuffer) {
		throw new Error('Binary download requires HttpClientResponse.readBodyBuffer');
	}

	return response.readBodyBuffer();
}
