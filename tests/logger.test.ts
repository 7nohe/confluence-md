import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createConsoleLogger,
	createSilentLogger,
	getLogger,
	type Logger,
	setLogger,
} from '../src/logger';

describe('logger.ts', () => {
	describe('setLogger and getLogger', () => {
		let originalLogger: Logger | undefined;

		beforeEach(() => {
			// Save current logger state (if any)
			try {
				originalLogger = getLogger();
			} catch {
				originalLogger = undefined;
			}
		});

		afterEach(() => {
			// Restore original logger
			if (originalLogger) {
				setLogger(originalLogger);
			}
		});

		it('should set and get logger', () => {
			const mockLogger: Logger = {
				info: vi.fn(),
				debug: vi.fn(),
				warning: vi.fn(),
				error: vi.fn(),
			};

			setLogger(mockLogger);
			const retrieved = getLogger();

			expect(retrieved).toBe(mockLogger);
		});

		it('should allow logger methods to be called', () => {
			const mockLogger: Logger = {
				info: vi.fn(),
				debug: vi.fn(),
				warning: vi.fn(),
				error: vi.fn(),
			};

			setLogger(mockLogger);
			const logger = getLogger();

			logger.info('info message');
			logger.debug('debug message');
			logger.warning('warning message');
			logger.error('error message');

			expect(mockLogger.info).toHaveBeenCalledWith('info message');
			expect(mockLogger.debug).toHaveBeenCalledWith('debug message');
			expect(mockLogger.warning).toHaveBeenCalledWith('warning message');
			expect(mockLogger.error).toHaveBeenCalledWith('error message');
		});
	});

	describe('createConsoleLogger', () => {
		let consoleLogSpy: ReturnType<typeof vi.spyOn>;
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleLogSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it('should log info messages to console.log', () => {
			const logger = createConsoleLogger();
			logger.info('test info');

			expect(consoleLogSpy).toHaveBeenCalledWith('test info');
		});

		it('should log warnings to console.warn with prefix', () => {
			const logger = createConsoleLogger();
			logger.warning('test warning');

			expect(consoleWarnSpy).toHaveBeenCalledWith('Warning: test warning');
		});

		it('should log errors to console.error with prefix', () => {
			const logger = createConsoleLogger();
			logger.error('test error');

			expect(consoleErrorSpy).toHaveBeenCalledWith('Error: test error');
		});

		it('should not log debug messages when verbose is false', () => {
			const logger = createConsoleLogger(false);
			logger.debug('test debug');

			expect(consoleLogSpy).not.toHaveBeenCalled();
		});

		it('should log debug messages when verbose is true', () => {
			const logger = createConsoleLogger(true);
			logger.debug('test debug');

			expect(consoleLogSpy).toHaveBeenCalledWith('[debug] test debug');
		});

		it('should default verbose to false', () => {
			const logger = createConsoleLogger();
			logger.debug('test debug');

			expect(consoleLogSpy).not.toHaveBeenCalled();
		});
	});

	describe('createSilentLogger', () => {
		let consoleLogSpy: ReturnType<typeof vi.spyOn>;
		let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
		let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

		beforeEach(() => {
			consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
			consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		});

		afterEach(() => {
			consoleLogSpy.mockRestore();
			consoleWarnSpy.mockRestore();
			consoleErrorSpy.mockRestore();
		});

		it('should not log any messages', () => {
			const logger = createSilentLogger();

			logger.info('info');
			logger.debug('debug');
			logger.warning('warning');
			logger.error('error');

			expect(consoleLogSpy).not.toHaveBeenCalled();
			expect(consoleWarnSpy).not.toHaveBeenCalled();
			expect(consoleErrorSpy).not.toHaveBeenCalled();
		});
	});
});
