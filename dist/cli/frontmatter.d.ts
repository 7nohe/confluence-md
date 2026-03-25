import type { FrontmatterResult } from './types';
export declare function extractFrontmatter(markdown: string): FrontmatterResult;
export declare function getPageIdFromFrontmatter(frontmatter: Record<string, unknown>, key: string): string | undefined;
export declare function getTitleFromFrontmatter(frontmatter: Record<string, unknown>): string | undefined;
