/**
 * Configuration file loading for CLI
 */
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
    exclude?: string[];
    notify_watchers?: boolean;
}
/**
 * Load configuration from file
 * @param configPath Optional explicit path to config file
 * @returns Parsed config or null if not found
 */
export declare function loadConfig(configPath?: string): ConfigFile | null;
//# sourceMappingURL=config.d.ts.map