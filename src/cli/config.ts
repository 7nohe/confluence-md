/**
 * Configuration file loading for CLI
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';

/**
 * Configuration file structure
 */
export interface ConfigFile {
	confluence_base_url?: string;
	email?: string;
	page_id?: string;
	space_key?: string;
	parent_page_id?: string;
	write_page_id?: boolean;
	title_override?: string;
	attachments_base?: string;
	frontmatter_page_id_key?: string;
	image_mode?: string;
	download_remote_images?: boolean;
	skip_if_unchanged?: boolean;
	dry_run?: boolean;
	notify_watchers?: boolean;
}

/**
 * Default config file paths to search
 */
const DEFAULT_CONFIG_PATHS = [
	'.confluence.yml',
	'.confluence.yaml',
	'.confluence.json',
	'confluence.config.yml',
];

/**
 * Load configuration from file
 * @param configPath Optional explicit path to config file
 * @returns Parsed config or null if not found
 */
export function loadConfig(configPath?: string): ConfigFile | null {
	const paths = configPath ? [configPath] : DEFAULT_CONFIG_PATHS;

	for (const p of paths) {
		const fullPath = path.resolve(process.cwd(), p);
		if (fs.existsSync(fullPath)) {
			return parseConfigFile(fullPath, p);
		}
	}
	return null;
}

/**
 * Parse a config file (YAML or JSON)
 */
function parseConfigFile(fullPath: string, filename: string): ConfigFile | null {
	try {
		const content = fs.readFileSync(fullPath, 'utf-8');
		if (filename.endsWith('.json')) {
			return JSON.parse(content) as ConfigFile;
		}
		// YAML parsing
		return yaml.load(content) as ConfigFile;
	} catch (error) {
		console.error(
			`Warning: Failed to parse config file ${filename}: ${
				error instanceof Error ? error.message : error
			}`
		);
		return null;
	}
}
