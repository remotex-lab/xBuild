/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * Represents an error specific to the xBuild process.
 *
 * The `xBuildError` class extends the `BaseError` class to provide a custom error type for the xBuild system.
 * It includes additional functionality to maintain stack trace information and assigns a specific name to
 * the error, making it easier to identify and handle in different parts of the application.
 *
 * @augments BaseError
 */

export class xBuildError extends BaseError {

    /**
     * Creates an instance of `xBuildError`.
     *
     * @param message - The error message that describes the error. This message is passed to the base class
     *   `BaseError` constructor and is used to provide context about the nature of the error.
     * @param options - Optional configuration for the error. This can include additional properties or settings
     *   that customize the error's behavior.
     */

    constructor(message: string, options?: ErrorOptions) {
        // Pass the message to the base class Error
        super(message);

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, xBuildError);
        }

        // Apply additional options if provided
        if (options) {
            Object.assign(this, options);
        }

        // Assign the name of the error
        this.name = 'xBuildError';
        this.stack = this.reformatStack(this.stack);
    }

    /**
     * Set external stack
     * Todo
     */

    setStack(stack: string): void {
        this.blockCode = null;
        this.stack = this.reformatStack(stack);
    }
}
