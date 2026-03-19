import type { ActionInputs } from './types';
export declare function getInputs(): ActionInputs;
export declare class PageIdNotFoundError extends Error {
    constructor(frontmatterKey: string);
}
export declare function validateInputs(inputs: ActionInputs, pageIdFromFrontmatter?: string, options?: {
    allowInputFallback?: boolean;
}): string;
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
export declare function createInputsFromRaw(raw: RawInputs): ActionInputs;
