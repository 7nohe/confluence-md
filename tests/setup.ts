/**
 * Test setup file - initializes logger for all tests
 */

import { beforeAll } from 'vitest';
import { createConsoleLogger, setLogger } from '../src/logger';

// Initialize logger before all tests
beforeAll(() => {
	setLogger(createConsoleLogger(false));
});
