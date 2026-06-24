/**
 * Logger abstraction for both GitHub Actions and CLI environments
 */
export interface Logger {
    info(message: string): void;
    debug(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    setSecret?(value: string): void;
}
/**
 * Set the global logger instance
 */
export declare function setLogger(logger: Logger): void;
/**
 * Get the global logger instance
 */
export declare function getLogger(): Logger;
/**
 * Create a logger that uses @actions/core
 * This is used in GitHub Actions context
 */
export declare function createActionsLogger(): Logger;
/**
 * Create a logger that uses console
 * This is used in CLI context
 */
export declare function createConsoleLogger(verbose?: boolean): Logger;
/**
 * Create a silent logger that suppresses all output
 * This is used in CLI context when --json is specified
 */
export declare function createSilentLogger(): Logger;
