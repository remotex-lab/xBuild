/**
 * Import will remove at compile time
 */

import type { Message } from 'esbuild';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';

/**
 * Represents an error that occurs during the esbuild process.
 *
 * This class extends the base error class to provide specific error handling for esbuild-related issues.
 * It captures the error message and maintains the proper stack trace, allowing for easier debugging
 * and identification of errors that occur during the build process.
 *
 * @class esbuildError
 * @extends BaseError
 *
 * @param message - An object containing the error message. The `text` property is used to set the
 * error message for the instance.
 *
 * @remarks
 * - This class is designed to handle errors specifically related to the esbuild process.
 * - A placeholder for printing the source code of the error is included for future implementation.
 * - The name of the error is set to 'EsbuildError' for clarity in error handling.
 *
 * @example
 * ```typescript
 * throw new EsbuildError({ text: 'Failed to build module.' });
 * ```
 * In this example, an instance of `EsbuildError` is thrown with a specified error message, which can
 * be caught and handled appropriately.
 *
 * @public
 */

export class esBuildError extends BaseError {
    /**
     * Creates an instance of the EsbuildError class.
     *
     * This constructor initializes the error message using the provided `message` object, captures
     * the stack trace for better debugging, and sets the name of the error to 'EsbuildError'.
     *
     * @param message - An object containing the error message. The `text` property is used to initialize
     * the base error class with a descriptive message about the error encountered during the esbuild process.
     *
     * @remarks
     * - The constructor includes a placeholder for future implementation of printing the source code related
     * to the error.
     * - The stack trace is captured to maintain the context of the error's origin, allowing developers
     * to trace back to the point of failure in the code.
     *
     * @public
     */

    constructor(message: Message) {
        super(message.text);
        // todo print source code of the error
        // use html import

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, esBuildError);
        }

        // Assign the name of the error
        this.name = 'EsbuildError';
    }
}
