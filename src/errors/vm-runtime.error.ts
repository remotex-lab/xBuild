/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * A custom error class to handle errors occurring within a virtual machine (VM) execution context.
 *
 * The `VMRuntimeError` class extends the native `Error` class and enhances the error with
 * source map information to map stack traces back to the original source. This is particularly
 * useful when debugging errors from code executed in a `vm` or `evalmachine` environment.
 *
 * @param message - The error message describing the error.
 * @param originalError - The original error object thrown from the VM execution.
 * @param sourceMap - The `SourceService` providing source map data to link the error to its original source.
 *
 * @example
 * ```typescript
 * try {
 *    vm.run(someCode);
 * } catch (error) {
 *    throw new VMRuntimeError("VM execution failed", error, sourceMapService);
 * }
 * ```
 */

export class VMRuntimeError extends BaseError {
    /**
     * The original error thrown during the VM execution.
     */

    originalError: Error;

    /**
     * Creates a new VMRuntimeError instance.
     *
     * This constructor initializes a new `VMRuntimeError` object, extending the native `Error` class with
     * additional information, including the original error and optional source map data. It also ensures that
     * the stack trace is correctly captured and reformatted using the source map (if provided) to enhance
     * debugging.
     *
     * @param originalError - The original error object that was thrown during the VM execution.
     * @param sourceMap - (Optional) The source map service used to map the error stack trace to its original
     *                    source code locations. If not provided, this will be `null`.
     *
     * @example
     * ```typescript
     * try {
     *    vm.run(code);
     * } catch (error) {
     *    throw new VMRuntimeError(error, sourceMapService);
     * }
     * ```
     */

    constructor(originalError: Error, sourceMap?: SourceService) {
        // Pass the message to the base class Error
        super(originalError.message, sourceMap);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, VMRuntimeError);
        }

        // Store the original error
        this.originalError = originalError;

        // Assign the name of the error
        this.name = 'VMRuntimeError';
        this.stack = this.reformatStack(originalError.stack);
    }
}
