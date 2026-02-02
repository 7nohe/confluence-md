import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfig } from '../../src/cli/config';

// Mock fs module
vi.mock('node:fs');
vi.mock('node:path', async () => {
	const actual = await vi.importActual('node:path');
	return {
		...actual,
		resolve: vi.fn((...args: string[]) => args.join('/')),
	};
});

describe('cli/config.ts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: files don't exist
		vi.mocked(fs.existsSync).mockReturnValue(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('loadConfig', () => {
		it('should return null when no config file exists', () => {
			vi.mocked(fs.existsSync).mockReturnValue(false);
			expect(loadConfig()).toBeNull();
		});

		it('should load YAML config file (.yml)', () => {
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.yml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(`
confluence_base_url: https://test.atlassian.net
email: test@example.com
page_id: "12345"
`);

			const config = loadConfig();
			expect(config).toEqual({
				confluence_base_url: 'https://test.atlassian.net',
				email: 'test@example.com',
				page_id: '12345',
			});
		});

		it('should load YAML config file (.yaml)', () => {
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.yaml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(`
confluence_base_url: https://example.atlassian.net
download_remote_images: true
`);

			const config = loadConfig();
			expect(config).toEqual({
				confluence_base_url: 'https://example.atlassian.net',
				download_remote_images: true,
			});
		});

		it('should load JSON config file', () => {
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.json');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(
				JSON.stringify({
					confluence_base_url: 'https://json.atlassian.net',
					email: 'json@example.com',
					dry_run: true,
				})
			);

			const config = loadConfig();
			expect(config).toEqual({
				confluence_base_url: 'https://json.atlassian.net',
				email: 'json@example.com',
				dry_run: true,
			});
		});

		it('should use explicit config path when provided', () => {
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).includes('custom-config.yml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(`
confluence_base_url: https://custom.atlassian.net
`);

			const config = loadConfig('custom-config.yml');
			expect(config).toEqual({
				confluence_base_url: 'https://custom.atlassian.net',
			});
		});

		it('should return null for invalid YAML', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.yml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue('invalid: yaml: content: [');

			const config = loadConfig();
			expect(config).toBeNull();
			expect(consoleSpy).toHaveBeenCalled();
		});

		it('should return null for invalid JSON', () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.json');
			});
			vi.mocked(fs.readFileSync).mockReturnValue('{ invalid json }');

			const config = loadConfig();
			expect(config).toBeNull();
			expect(consoleSpy).toHaveBeenCalled();
		});

		it('should try default paths in order', () => {
			// Only confluence.config.yml exists (last in the list)
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('confluence.config.yml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(`
confluence_base_url: https://last.atlassian.net
`);

			const config = loadConfig();
			expect(config).toEqual({
				confluence_base_url: 'https://last.atlassian.net',
			});
		});

		it('should parse all config options', () => {
			vi.mocked(fs.existsSync).mockImplementation((p) => {
				return String(p).endsWith('.confluence.yml');
			});
			vi.mocked(fs.readFileSync).mockReturnValue(`
confluence_base_url: https://full.atlassian.net
email: full@example.com
page_id: "99999"
title_override: "Custom Title"
attachments_base: ./images
frontmatter_page_id_key: wiki_id
image_mode: external
download_remote_images: true
skip_if_unchanged: false
dry_run: true
notify_watchers: false
`);

			const config = loadConfig();
			expect(config).toEqual({
				confluence_base_url: 'https://full.atlassian.net',
				email: 'full@example.com',
				page_id: '99999',
				title_override: 'Custom Title',
				attachments_base: './images',
				frontmatter_page_id_key: 'wiki_id',
				image_mode: 'external',
				download_remote_images: true,
				skip_if_unchanged: false,
				dry_run: true,
				notify_watchers: false,
			});
		});
	});
});
