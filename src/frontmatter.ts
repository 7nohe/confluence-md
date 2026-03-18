import * as fs from 'node:fs';
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

export function getTitleFromFrontmatter(frontmatter: Record<string, unknown>): string | undefined {
	const value = frontmatter.title;

	if (value === undefined || value === null) {
		return undefined;
	}

	const title = String(value).trim();
	return title === '' ? undefined : title;
}

export function extractFirstH1(markdownBody: string): string | undefined {
	const match = markdownBody.match(/^#\s+(.+)$/m);
	return match ? match[1].trim() : undefined;
}

export function writePageIdToFrontmatter(
	filePath: string,
	markdown: string,
	pageId: string,
	key: string
): void {
	const { data, content } = matter(markdown);
	data[key] = pageId;
	const updated = matter.stringify(content, data);
	fs.writeFileSync(filePath, updated, 'utf-8');
}
