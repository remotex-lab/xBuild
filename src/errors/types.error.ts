/**
 * Custom error class to represent type-related errors.
 *
 * This class extends the built-in `Error` class to provide more specific
 * error handling for issues related to types. It can be used to distinguish
 * errors that occur due to type mismatches or other type-related problems
 * in your application.
 *
 * @example
 * ```typescript
 * throw new TypesError('Invalid type encountered.');
 * ```
 *
 * @augments Error
 */

export class TypesError extends Error {
    /**
     * Creates an instance of `TypesError`.
     *
     * @param message - A human-readable message providing details about the error.
     * @param options - Optional configuration for the error, such as a `cause` (ECMAScript 2022+).
     * @param options.cause
     */

    constructor(message?: string, options?: { cause?: Error }) {
        super(message);
        this.name = 'TypesError';

        // Set the prototype explicitly to ensure instanceof checks work correctly
        Object.setPrototypeOf(this, TypesError.prototype);

        if (options?.cause) {
            // Optionally include the cause of the error, if provided
            this.cause = options.cause;
        }
    }
}
