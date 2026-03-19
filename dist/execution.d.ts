import { type RunResult } from './core';
import type { ActionInputs, MultiRunResult, ResolvedSourceFile } from './types';
export type SourceExecutionResult = {
    mode: 'single';
    result: RunResult;
} | {
    mode: 'multi';
    result: MultiRunResult;
};
export declare function runSourceExecution(inputs: ActionInputs): Promise<SourceExecutionResult>;
export declare function resolveMarkdownFiles(sourceDirectory: string): ResolvedSourceFile[];
