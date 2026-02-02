/**
 * Link and image handlers
 */

import type { Image, Link } from 'mdast';
import type { Parent } from 'unist';
import type { ImageReference } from '../../types';
import { generateAttachmentFilename } from '../../utils/filename';
import { isRemoteUrl } from '../../utils/url';
import { createElement, createImage } from '../xml';
import type { NodeHandler } from './types';

/**
 * Handle link nodes
 */
export const linkHandler: NodeHandler = (node, state) => {
	const link = node as unknown as Link;
	const attrs: Record<string, string> = {
		href: link.url,
	};
	if (link.title) {
		attrs.title = link.title;
	}
	return createElement('a', attrs, state.convertChildren(node as unknown as Parent));
};

/**
 * Handle image nodes
 */
export const imageHandler: NodeHandler = (node, state) => {
	const image = node as unknown as Image;
	const src = image.url;
	const alt = image.alt || undefined;
	const title = image.title || undefined;
	const isRemote = isRemoteUrl(src);

	// Determine if we should use attachment mode
	const useAttachment =
		!isRemote || (state.context.downloadRemoteImages && state.context.imageMode === 'upload');

	// Track the image reference
	const imageRef: ImageReference = {
		src,
		alt,
		title,
		isRemote,
	};

	if (useAttachment) {
		const filename = generateAttachmentFilename(src, state.existingFilenames);
		imageRef.attachmentFilename = filename;
		state.context.images.push(imageRef);
		return createImage({ type: 'attachment', filename }, alt, title);
	}

	// Use external URL for remote images
	state.context.images.push(imageRef);
	return createImage({ type: 'url', url: src }, alt, title);
};
