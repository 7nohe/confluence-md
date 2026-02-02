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

let globalLogger: Logger | null = null;

/**
 * Set the global logger instance
 */
export function setLogger(logger: Logger): void {
	globalLogger = logger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
	if (!globalLogger) {
		throw new Error('Logger not initialized. Call setLogger() first.');
	}
	return globalLogger;
}

/**
 * Create a logger that uses @actions/core
 * This is used in GitHub Actions context
 */
export function createActionsLogger(): Logger {
	// Dynamic import to avoid bundling @actions/core in CLI build
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const core = require('@actions/core');
	return {
		info: (msg: string) => core.info(msg),
		debug: (msg: string) => core.debug(msg),
		warning: (msg: string) => core.warning(msg),
		error: (msg: string) => core.error(msg),
		setSecret: (val: string) => core.setSecret(val),
	};
}

/**
 * Create a logger that uses console
 * This is used in CLI context
 */
export function createConsoleLogger(verbose = false): Logger {
	return {
		info: (msg: string) => console.log(msg),
		debug: (msg: string) => {
			if (verbose) {
				console.log(`[debug] ${msg}`);
			}
		},
		warning: (msg: string) => console.warn(`Warning: ${msg}`),
		error: (msg: string) => console.error(`Error: ${msg}`),
	};
}

/**
 * Create a silent logger that suppresses all output
 * This is used in CLI context when --json is specified
 */
export function createSilentLogger(): Logger {
	return {
		info: () => {},
		debug: () => {},
		warning: () => {},
		error: () => {},
	};
}
