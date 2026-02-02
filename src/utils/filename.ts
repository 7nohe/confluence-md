/**
 * Filename utility functions for attachments
 */

import * as path from 'node:path';
import { stripQueryParams } from './url';

/**
 * Generate a unique filename for an image, handling collisions
 */
export function generateAttachmentFilename(src: string, existingFilenames: Set<string>): string {
	let basename = path.basename(stripQueryParams(src));

	// If no extension, add .png as default
	if (!path.extname(basename)) {
		basename += '.png';
	}

	// Handle collisions
	if (!existingFilenames.has(basename)) {
		existingFilenames.add(basename);
		return basename;
	}

	// Add numeric suffix for collisions
	const ext = path.extname(basename);
	const name = path.basename(basename, ext);
	let counter = 1;
	let newName = `${name}_${counter}${ext}`;

	while (existingFilenames.has(newName)) {
		counter++;
		newName = `${name}_${counter}${ext}`;
	}

	existingFilenames.add(newName);
	return newName;
}

/**
 * Get the extension from a URL or path, handling query params
 */
export function getImageExtension(src: string): string {
	const basename = stripQueryParams(path.basename(src));
	const ext = path.extname(basename).toLowerCase();
	return ext || '.png'; // Default to .png if no extension
}
