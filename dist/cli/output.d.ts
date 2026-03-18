/**
 * Output formatting for CLI
 */
import type { ActionOutputs, MultiRunResult } from '../types';
/**
 * Format outputs as JSON
 */
export declare function formatJsonOutput(outputs: ActionOutputs): string;
export declare function formatMultiRunJsonOutput(result: MultiRunResult): string;
/**
 * Print success output to console
 */
export declare function printSuccessOutput(outputs: ActionOutputs): void;
export declare function printMultiRunOutput(result: MultiRunResult): void;
/**
 * Format an error for output
 */
export declare function formatError(error: unknown, asJson: boolean): string;
//# sourceMappingURL=output.d.ts.map