/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';
import type { ErrorType } from '@errors/interfaces/stack.interface';

/**
 * Imports
 */

import { formatStackTrace } from '@errors/stack.error';

/**
 * A base class for custom errors with enhanced stack trace formatting and source code information.
 *
 * The `BaseError` class extends the native `Error` class, adding functionality to format the error stack
 * trace and include details from a source map service. This is useful for debugging errors in compiled
 * or transpiled code by providing clearer information about the source of the error.
 */

export abstract class BaseError extends Error {
    callStacks: Array<NodeJS.CallSite> = [];

    /**
     * Creates a new instance of `BaseError`.
     *
     * This constructor initializes a new `BaseError` instance by setting the error message and formatting
     * the stack trace using the provided source map information. It also ensures the stack trace is maintained
     * correctly by using `Error.captureStackTrace` (if available). The default source map service is used if
     * none is provided.
     *
     * @param message - A descriptive error message to be associated with the error.
     * @param sourceMap - (Optional) The `SourceService` instance used to format and resolve the stack trace.
     *                    If not provided, the default source map service (`defaultSourceService`) is used.
     */

    protected constructor(message: string, public readonly sourceMap?: SourceService) {
        super(message);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseError);
        }

        // Assign the name of the error
        this.name = 'xBuildBaseError';
    }

    /**
     * Reformats the error stack trace using source map information.
     *
     * This function enhances the original error stack trace by attempting to map each entry
     * back to its original position in the source file using the provided source map service.
     * If the source map information is not available, it returns the original stack trace.
     *
     * @param error - The original error with stack trace of the error.
     * @returns The reformatted stack trace or the original stack trace if no mapping is available.
     */

    protected reformatStack(error: ErrorType): string {;
        if (!error.callStacks)
            return error.stack ?? '';

        return formatStackTrace(this, error.callStacks);
    }
}
