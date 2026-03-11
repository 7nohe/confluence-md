import * as core from '@actions/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createInputsFromRaw, getInputs, validateInputs } from '../src/inputs';

vi.mock('@actions/core', () => ({
	getInput: vi.fn(),
	getBooleanInput: vi.fn(),
	setSecret: vi.fn(),
	info: vi.fn(),
	debug: vi.fn(),
	warning: vi.fn(),
}));

describe('inputs.ts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getInputs', () => {
		function setupMockInputs(
			inputs: Record<string, string>,
			booleans: Record<string, boolean> = {}
		) {
			vi.mocked(core.getInput).mockImplementation((name: string) => inputs[name] || '');
			vi.mocked(core.getBooleanInput).mockImplementation((name: string) => booleans[name] ?? false);
		}

		it('should read all required inputs', () => {
			setupMockInputs({
				source: 'docs/test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'secret-token',
			});

			const inputs = getInputs();

			expect(inputs.source).toBe('docs/test.md');
			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net/wiki');
			expect(inputs.email).toBe('user@example.com');
			expect(inputs.apiToken).toBe('secret-token');
		});

		it('should use source directory as attachmentsBase when not provided', () => {
			setupMockInputs({
				source: 'docs/pages/test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.attachmentsBase).toBe('docs/pages');
			expect(inputs.attachmentsBaseProvided).toBe(false);
		});

		it('should use provided attachmentsBase', () => {
			setupMockInputs({
				source: 'docs/test.md',
				attachments_base: 'assets/images',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.attachmentsBase).toBe('assets/images');
			expect(inputs.attachmentsBaseProvided).toBe(true);
		});

		it('should mask API token using setSecret', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'my-secret-token',
			});

			getInputs();

			expect(core.setSecret).toHaveBeenCalledWith('my-secret-token');
		});

		it('should accept "upload" as valid imageMode', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				image_mode: 'upload',
			});

			const inputs = getInputs();

			expect(inputs.imageMode).toBe('upload');
		});

		it('should accept "external" as valid imageMode', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				image_mode: 'external',
			});

			const inputs = getInputs();

			expect(inputs.imageMode).toBe('external');
		});

		it('should throw error for invalid imageMode', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				image_mode: 'invalid',
			});

			expect(() => getInputs()).toThrow(
				"Invalid image_mode: invalid. Must be 'upload' or 'external'."
			);
		});

		it('should default imageMode to "upload"', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.imageMode).toBe('upload');
		});

		it('should parse boolean inputs correctly', () => {
			setupMockInputs(
				{
					source: 'test.md',
					confluence_base_url: 'https://example.atlassian.net/wiki',
					email: 'user@example.com',
					api_token: 'token',
				},
				{
					download_remote_images: true,
					skip_if_unchanged: true,
					dry_run: false,
					notify_watchers: true,
				}
			);

			const inputs = getInputs();

			expect(inputs.downloadRemoteImages).toBe(true);
			expect(inputs.skipIfUnchanged).toBe(true);
			expect(inputs.dryRun).toBe(false);
			expect(inputs.notifyWatchers).toBe(true);
		});

		it('should use default user agent when not provided', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.userAgent).toBe('confluence-md');
		});

		it('should use custom user agent when provided', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				user_agent: 'my-custom-agent/1.0',
			});

			const inputs = getInputs();

			expect(inputs.userAgent).toBe('my-custom-agent/1.0');
		});

		it('should remove trailing slash from base URL', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki/',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net/wiki');
		});

		it('should remove multiple trailing slashes from base URL', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki///',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net/wiki');
		});

		it('should preserve URL without trailing slash', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net/wiki');
		});

		it('should set optional pageId from input', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				page_id: '12345',
			});

			const inputs = getInputs();

			expect(inputs.pageId).toBe('12345');
		});

		it('should set pageId as undefined when not provided', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.pageId).toBeUndefined();
		});

		it('should set titleOverride from input', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				title_override: 'Custom Title',
			});

			const inputs = getInputs();

			expect(inputs.titleOverride).toBe('Custom Title');
		});

		it('should use default frontmatter key', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
			});

			const inputs = getInputs();

			expect(inputs.frontmatterPageIdKey).toBe('confluence_page_id');
		});

		it('should use custom frontmatter key when provided', () => {
			setupMockInputs({
				source: 'test.md',
				confluence_base_url: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				api_token: 'token',
				frontmatter_page_id_key: 'custom_page_id',
			});

			const inputs = getInputs();

			expect(inputs.frontmatterPageIdKey).toBe('custom_page_id');
		});
	});

	describe('validateInputs', () => {
		it('should return pageId from frontmatter when provided', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				frontmatterPageIdKey: 'confluence_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			const result = validateInputs(inputs, '67890');

			expect(result).toBe('67890');
		});

		it('should return pageId from inputs when frontmatter not provided', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				pageId: '12345',
				frontmatterPageIdKey: 'confluence_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			const result = validateInputs(inputs);

			expect(result).toBe('12345');
		});

		it('should prefer frontmatter pageId over input pageId', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				pageId: '12345',
				frontmatterPageIdKey: 'confluence_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			const result = validateInputs(inputs, '67890');

			expect(result).toBe('67890');
		});

		it('should throw error when no pageId is found', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				frontmatterPageIdKey: 'confluence_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			expect(() => validateInputs(inputs)).toThrow(
				"Page ID not found. Please provide it via the 'page_id' input or in frontmatter using the key 'confluence_page_id'."
			);
		});

		it('should ignore input pageId when fallback is disabled', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				pageId: '12345',
				frontmatterPageIdKey: 'confluence_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			expect(() => validateInputs(inputs, undefined, { allowInputFallback: false })).toThrow(
				"Page ID not found. Please provide it via the 'page_id' input or in frontmatter using the key 'confluence_page_id'."
			);
		});

		it('should include custom frontmatter key in error message', () => {
			const inputs = {
				confluenceBaseUrl: 'https://example.atlassian.net/wiki',
				email: 'user@example.com',
				apiToken: 'token',
				source: 'test.md',
				attachmentsBase: '.',
				frontmatterPageIdKey: 'custom_page_id',
				imageMode: 'upload' as const,
				downloadRemoteImages: false,
				skipIfUnchanged: false,
				dryRun: false,
				notifyWatchers: false,
				userAgent: 'test',
			};

			expect(() => validateInputs(inputs)).toThrow("'custom_page_id'");
		});
	});

	describe('createInputsFromRaw', () => {
		it('should create valid inputs from raw CLI values', () => {
			const inputs = createInputsFromRaw({
				source: 'docs/page.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token123',
			});

			expect(inputs.source).toBe('docs/page.md');
			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net');
			expect(inputs.email).toBe('user@example.com');
			expect(inputs.apiToken).toBe('token123');
		});

		it('should use source directory as attachmentsBase when not provided', () => {
			const inputs = createInputsFromRaw({
				source: 'docs/pages/test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.attachmentsBase).toBe('docs/pages');
			expect(inputs.attachmentsBaseProvided).toBe(false);
		});

		it('should use provided attachmentsBase', () => {
			const inputs = createInputsFromRaw({
				source: 'docs/test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				attachmentsBase: 'assets/images',
			});

			expect(inputs.attachmentsBase).toBe('assets/images');
			expect(inputs.attachmentsBaseProvided).toBe(true);
		});

		it('should remove trailing slash from base URL', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net/',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.confluenceBaseUrl).toBe('https://example.atlassian.net');
		});

		it('should default imageMode to upload', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.imageMode).toBe('upload');
		});

		it('should accept external as imageMode', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				imageMode: 'external',
			});

			expect(inputs.imageMode).toBe('external');
		});

		it('should throw error for invalid imageMode', () => {
			expect(() =>
				createInputsFromRaw({
					source: 'test.md',
					confluenceBaseUrl: 'https://example.atlassian.net',
					email: 'user@example.com',
					apiToken: 'token',
					imageMode: 'invalid',
				})
			).toThrow("Invalid image_mode: invalid. Must be 'upload' or 'external'.");
		});

		it('should use CLI-specific default user agent', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.userAgent).toBe('confluence-md-cli');
		});

		it('should use custom user agent when provided', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				userAgent: 'my-custom-agent',
			});

			expect(inputs.userAgent).toBe('my-custom-agent');
		});

		it('should default skipIfUnchanged to true', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.skipIfUnchanged).toBe(true);
		});

		it('should default dryRun to false', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.dryRun).toBe(false);
		});

		it('should default downloadRemoteImages to false', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.downloadRemoteImages).toBe(false);
		});

		it('should use default frontmatter key', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
			});

			expect(inputs.frontmatterPageIdKey).toBe('confluence_page_id');
		});

		it('should use custom frontmatter key when provided', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				frontmatterPageIdKey: 'page_id',
			});

			expect(inputs.frontmatterPageIdKey).toBe('page_id');
		});

		it('should set all boolean options when provided', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				downloadRemoteImages: true,
				skipIfUnchanged: false,
				dryRun: true,
				notifyWatchers: true,
			});

			expect(inputs.downloadRemoteImages).toBe(true);
			expect(inputs.skipIfUnchanged).toBe(false);
			expect(inputs.dryRun).toBe(true);
			expect(inputs.notifyWatchers).toBe(true);
		});

		it('should set pageId when provided', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				pageId: '12345',
			});

			expect(inputs.pageId).toBe('12345');
		});

		it('should set titleOverride when provided', () => {
			const inputs = createInputsFromRaw({
				source: 'test.md',
				confluenceBaseUrl: 'https://example.atlassian.net',
				email: 'user@example.com',
				apiToken: 'token',
				titleOverride: 'Custom Title',
			});

			expect(inputs.titleOverride).toBe('Custom Title');
		});
	});
});
