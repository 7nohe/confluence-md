/**
 * Confluence API client using @actions/http-client
 */

import { Readable } from 'node:stream';
import { HttpClient, type HttpClientResponse } from '@actions/http-client';
import { getLogger } from '../logger';

export interface ClientOptions {
	baseUrl: string;
	email: string;
	apiToken: string;
	userAgent: string;
}

export class ConfluenceClient {
	private http: HttpClient;
	private baseUrl: string;
	private authHeader: string;
	private userAgentString: string;

	constructor(options: ClientOptions) {
		this.baseUrl = options.baseUrl;
		this.authHeader = `Basic ${Buffer.from(`${options.email}:${options.apiToken}`).toString('base64')}`;
		this.userAgentString = options.userAgent;
		this.http = new HttpClient(options.userAgent, undefined, {
			headers: {
				Authorization: this.authHeader,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});
	}

	/**
	 * Make a GET request
	 */
	async get<T>(path: string): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		getLogger().debug(`GET ${url}`);

		const response = await this.http.get(url);
		return this.handleResponse<T>(response);
	}

	/**
	 * Make a PUT request with JSON body
	 */
	async put<T>(path: string, body: unknown): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		getLogger().debug(`PUT ${url}`);

		const response = await this.http.put(url, JSON.stringify(body));
		return this.handleResponse<T>(response);
	}

	/**
	 * Make a POST request with multipart form data (for attachments)
	 */
	async postMultipart<T>(
		path: string,
		filename: string,
		content: Buffer,
		mimeType: string
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		getLogger().debug(`POST ${url} (multipart)`);

		const boundary = `----FormBoundary${Math.random().toString(36).substring(2)}`;

		const bodyParts: Buffer[] = [];

		// Add file part
		const fileHeader = [
			`--${boundary}`,
			`Content-Disposition: form-data; name="file"; filename="${filename}"`,
			`Content-Type: ${mimeType}`,
			'',
			'',
		].join('\r\n');

		bodyParts.push(Buffer.from(fileHeader));
		bodyParts.push(content);
		bodyParts.push(Buffer.from('\r\n'));

		// End boundary
		bodyParts.push(Buffer.from(`--${boundary}--\r\n`));

		const body = Buffer.concat(bodyParts);
		const contentLength = body.length;

		// Create a new HttpClient for multipart requests with different headers
		const multipartHttp = new HttpClient(this.userAgentString, undefined, {
			headers: {
				Authorization: this.authHeader,
				'Content-Type': `multipart/form-data; boundary=${boundary}`,
				'Content-Length': contentLength.toString(),
				'X-Atlassian-Token': 'no-check',
				Accept: 'application/json',
			},
		});

		const response = await multipartHttp.sendStream('POST', url, Readable.from(body));
		return this.handleResponse<T>(response);
	}

	/**
	 * Handle HTTP response
	 */
	private async handleResponse<T>(response: HttpClientResponse): Promise<T> {
		const statusCode = response.message.statusCode || 0;
		const body = await response.readBody();

		if (statusCode >= 400) {
			let errorMessage = `HTTP ${statusCode}`;
			try {
				const errorBody = JSON.parse(body);
				if (errorBody.message) {
					errorMessage += `: ${errorBody.message}`;
				} else if (errorBody.errorMessage) {
					errorMessage += `: ${errorBody.errorMessage}`;
				}
				getLogger().debug(`Error response body: ${body}`);
			} catch {
				// Body is not JSON
				getLogger().debug(`Error response body (non-JSON): ${body}`);
			}
			throw new Error(errorMessage);
		}

		if (!body) {
			return {} as T;
		}

		try {
			return JSON.parse(body) as T;
		} catch {
			throw new Error(`Failed to parse response as JSON: ${body.substring(0, 200)}`);
		}
	}
}
