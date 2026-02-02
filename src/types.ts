export interface ActionInputs {
	confluenceBaseUrl: string;
	pageId?: string;
	email: string;
	apiToken: string;
	source: string;
	attachmentsBase: string;
	titleOverride?: string;
	frontmatterPageIdKey: string;
	imageMode: 'upload' | 'external';
	downloadRemoteImages: boolean;
	skipIfUnchanged: boolean;
	dryRun: boolean;
	notifyWatchers: boolean;
	userAgent: string;
}

export interface FrontmatterResult {
	data: Record<string, unknown>;
	content: string;
}

export interface AttachmentInfo {
	filename: string;
	localPath: string;
	mimeType: string;
	isRemote: boolean;
	originalUrl?: string;
}

export interface ImageReference {
	src: string;
	alt?: string;
	title?: string;
	isRemote: boolean;
	attachmentFilename?: string;
}

export interface ConversionContext {
	attachmentsBase: string;
	imageMode: 'upload' | 'external';
	downloadRemoteImages: boolean;
	images: ImageReference[];
}

export interface ConversionResult {
	storage: string;
	images: ImageReference[];
}

export interface ConfluencePage {
	id: string;
	title: string;
	version: {
		number: number;
		message?: string;
	};
	body?: {
		storage?: {
			value: string;
			representation: string;
		};
	};
	_links?: {
		webui?: string;
		base?: string;
	};
}

export interface ConfluencePageUpdate {
	id: string;
	status: 'current';
	title: string;
	body: {
		representation: 'storage';
		value: string;
	};
	version: {
		number: number;
		message?: string;
	};
}

export interface ConfluenceAttachment {
	id: string;
	title: string;
	mediaType: string;
	fileSize: number;
	_links?: {
		download?: string;
	};
}

export interface ActionOutputs {
	pageUrl: string;
	pageId: string;
	version: number;
	updated: boolean;
	attachmentsUploaded: number;
	contentHash: string;
}
