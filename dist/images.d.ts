/**
 * Image handling utilities
 */
import type { ImageReference } from './types';
export { getImageExtension } from './utils/filename';
export { isRemoteUrl } from './utils/url';
/**
 * Resolve a local image path relative to the attachments base
 */
export declare function resolveLocalImagePath(src: string, attachmentsBase: string): string;
/**
 * Check if a local image exists
 */
export declare function localImageExists(src: string, attachmentsBase: string): boolean;
/**
 * Filter images that need to be uploaded as attachments
 */
export declare function getImagesToUpload(images: ImageReference[], imageMode: 'upload' | 'external', downloadRemoteImages: boolean): ImageReference[];
