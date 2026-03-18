/**
 * Confluence API client using @actions/http-client
 */
export interface ClientOptions {
    baseUrl: string;
    email: string;
    apiToken: string;
    userAgent: string;
}
export declare class ConfluenceClient {
    private http;
    private baseUrl;
    private authHeader;
    private userAgentString;
    constructor(options: ClientOptions);
    /**
     * Make a GET request
     */
    get<T>(path: string): Promise<T>;
    /**
     * Make a PUT request with JSON body
     */
    put<T>(path: string, body: unknown): Promise<T>;
    /**
     * Make a POST request with multipart form data (for attachments)
     */
    postMultipart<T>(path: string, filename: string, content: Buffer, mimeType: string): Promise<T>;
    /**
     * Handle HTTP response
     */
    private handleResponse;
}
//# sourceMappingURL=client.d.ts.map