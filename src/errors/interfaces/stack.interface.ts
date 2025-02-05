/**
 * A custom error type that extends the native `Error` object by adding a `callStacks` property.
 * This property contains an array of `NodeJS.CallSite` objects, representing the call stack details.
 */
import type { BaseError } from '@errors/base.error';

/**
 * Represents an enhanced error type that extends the built-in Error object.
 * This type adds an optional property to store call stack information.
 *
 * @type ErrorType
 *
 * @extends Error
 *
 * @property callStacks - An optional array of call sites
 *   captured when the error was created. This can provide additional context
 *   regarding the call stack at the time of the error, useful for debugging.
 *
 * @example
 * ```ts
 * const myError: ErrorType = new Error("Something went wrong!");
 * myError.callStacks = getCallStack(); // Assuming getCallStack captures call sites.
 * console.error(myError);
 * ```
 */

export type ErrorType = Error & { callStacks?: Array<NodeJS.CallSite> };

/**
 * Represents the state of a stack trace, containing information about the error, associated code, and formatted error message.
 *
 * @interface StackTraceStateInterface
 * @property error - The error object with attached `callStacks`.
 * @property blockCode - The block of code (if any) related to the error, or `null` if unavailable.
 * @property formattedError - A formatted string representing the error details.
 */

export interface StackTraceStateInterface {
    error: ErrorType & BaseError,
    blockCode: null | string;
    formattedError: string;
}

/**
 * Represents detailed information about a specific frame in the call stack.
 *
 * @interface FrameDetailsInterface
 * @property line - The line number where the frame occurred.
 * @property column - The column number where the frame occurred.
 * @property source - The source file path where the frame occurred.
 * @property functionName - The name of the function being executed at this frame, or an empty string if not available.
 */

export interface FrameDetailsInterface {
    line: number;
    column: number;
    source: string;
    functionName: string;
}
