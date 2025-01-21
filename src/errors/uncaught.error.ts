/**
 * Handles uncaught exceptions in the Node.js process.
 *
 * This handler is triggered when an error is thrown that is not caught by any try-catch blocks.
 * It captures such exceptions and logs them to the console. If the exception is an instance of `Error`,
 * its string representation is logged. Otherwise, the raw error object is logged.
 *
 * This setup helps in debugging by ensuring that all uncaught exceptions are logged, providing visibility
 * into errors that might otherwise go unnoticed.
 *
 * @example
 * ```ts
 * process.on('uncaughtException', (error) => {
 *     if (error instanceof Error) {
 *         console.error(error.toString());
 *     } else {
 *         console.error(error);
 *     }
 * });
 * ```
 *
 * @throws Will log uncaught exceptions to the console.
 * Custom handling logic should be added if additional error handling or logging is required.
 */

process.on('uncaughtException', (error: Error) => {
    console.error(error.stack);
    process.exit(1);
});

/**
 * Handles unhandled promise rejections in the Node.js process.
 *
 * This handler is triggered when a promise is rejected, and no rejection handler is attached to it.
 * It captures such rejections and logs them to the console. If the rejection reason is an instance of `Error`,
 * its string representation is logged. Otherwise, the raw rejection reason is logged.
 *
 * This setup helps in debugging by ensuring that all unhandled promise rejections are logged, providing visibility
 * into issues related to unhandled promises that might otherwise go unnoticed.
 *
 * @example
 * ```ts
 * process.on('unhandledRejection', (reason) => {
 *     if (reason instanceof Error) {
 *         console.error(reason.toString());
 *     } else {
 *         console.error(reason);
 *     }
 * });
 * ```
 *
 * @throws Will log unhandled promise rejections to the console.
 * Custom handling logic should be added if additional handling or logging is required.
 */

process.on('unhandledRejection', (reason: Error) => {
    console.error(reason.stack);
    process.exit(1);
});
