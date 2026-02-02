/**
 * URL utility functions
 */

/**
 * Check if a URL is a remote URL (http/https)
 */
export function isRemoteUrl(url: string): boolean {
	return /^https?:\/\//i.test(url);
}

/**
 * Remove query parameters from a URL path
 */
export function stripQueryParams(path: string): string {
	const queryIndex = path.indexOf('?');
	return queryIndex !== -1 ? path.substring(0, queryIndex) : path;
}
