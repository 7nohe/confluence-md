import matter from 'gray-matter';
import type { FrontmatterResult } from './types';

export function extractFrontmatter(markdown: string): FrontmatterResult {
	const { data, content } = matter(markdown);
	return { data, content };
}

export function getPageIdFromFrontmatter(
	frontmatter: Record<string, unknown>,
	key: string
): string | undefined {
	const value = frontmatter[key];

	if (value === undefined || value === null) {
		return undefined;
	}

	// Convert to string (handles both string and number page IDs)
	const pageId = String(value).trim();

	if (pageId === '') {
		return undefined;
	}

	return pageId;
}
