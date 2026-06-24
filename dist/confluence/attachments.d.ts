/**
 * Confluence attachment operations
 */
import type { ConfluenceAttachment, ImageReference } from '../types';
import type { ConfluenceClient } from './client';
/**
 * Upload an attachment to a page
 */
export declare function uploadAttachment(client: ConfluenceClient, pageId: string, filename: string, content: Buffer): Promise<ConfluenceAttachment>;
/**
 * Upload multiple attachments from image references
 */
export declare function uploadAttachments(client: ConfluenceClient, pageId: string, images: ImageReference[], attachmentsBase: string): Promise<number>;
//# sourceMappingURL=attachments.d.ts.map