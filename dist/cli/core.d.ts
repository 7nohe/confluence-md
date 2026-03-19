/**
 * Core business logic for confluence-md
 * This module is shared between GitHub Actions and CLI entry points
 */
import type { ActionInputs, ActionOutputs } from './types';
export interface RunOptions {
    inputs: ActionInputs;
    markdownContent: string;
    pageId: string;
}
export interface RunResult {
    outputs: ActionOutputs;
    storage?: string;
    imagesCount?: number;
}
/**
 * Run the markdown to confluence conversion and update
 */
export declare function runConversion(options: RunOptions): Promise<RunResult>;
