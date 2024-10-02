/**
 * Import will remove at compile time
 */

import type { PositionSourceInterface, StackEntryInterface } from '@remotex-labs/xmap';

/**
 * Imports
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import { setColor, Colors } from '@components/colors.component';
import { SourceService, highlightCode, formatErrorCode, parseErrorStack } from '@remotex-labs/xmap';

/**
 * Constants
 */

export const dirname = __dirname;
export const sourceMapData = readFileSync(join(dirname, 'index.js.map'));
export const defaultSourceService = new SourceService(JSON.parse(sourceMapData.toString()));

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
 * ```typescript
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

process.on('uncaughtException', (error: unknown) => {
    if (error instanceof Error) {
        console.error(error.toString()); // Customize this line as needed
    } else {
        console.error(error); // Handle non-error objects
    }
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
 * ```typescript
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

process.on('unhandledRejection', (reason) => {
    if (reason instanceof Error) {
        console.error(reason.toString()); // Customize this line as needed
    } else {
        console.error(reason); // Handle non-error objects
    }
});

/**
 * Resolves the source position for a stack trace entry using the provided source map.
 *
 * This helper function maps a stack trace entry from a compiled or transpiled file
 * back to its original position in the source file using the `SourceService`. If the stack trace
 * originates from code executed in a `VM` context (e.g., `evalmachine`), it attempts to resolve
 * the source position; otherwise, it returns `null`.
 *
 * @param stackEntry - The stack entry containing file, line, and column information.
 * @param sourceService - The `SourceService` used to map the stack entry to its original source.
 * @returns A `PositionSourceInterface` object containing the original file, line, and column positions,
 *          or `null` if the source cannot be resolved.
 */

function resolveSourcePosition(stackEntry: StackEntryInterface, sourceService: SourceService): PositionSourceInterface | null {
    if ((stackEntry.file.includes('evalmachine') || stackEntry.file.includes('node:vm')))
        return sourceService.getSourcePosition(stackEntry.line, stackEntry.column);

    return defaultSourceService.getSourcePosition(stackEntry.line, stackEntry.column);
}

/**
 * A base class for custom errors with enhanced stack trace formatting and source code information.
 *
 * The `BaseError` class extends the native `Error` class, adding functionality to format the error stack
 * trace and include details from a source map service. This is useful for debugging errors in compiled
 * or transpiled code by providing clearer information about the source of the error.
 *
 * @augments Error
 */

export abstract class BaseError extends Error {
    /**
     * An array to hold the formatted lines of the stack trace.
     *
     * This property contains the enhanced stack trace of the error, formatted using source map information,
     * if available.
     */

    stackArray: Array<string> = [];

    /**
     * The code block related to the error.
     *
     * This property holds a string representing the code snippet where the error occurred. It is formatted
     * for better readability and is set based on the source map details.
     */

    blockCode: string | null = null;

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

    protected constructor(message: string, protected sourceMap: SourceService = defaultSourceService) {
        super(message);
        if (!global.__ACTIVE_COLOR) {
            global.__ACTIVE_COLOR = true;
        }

        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BaseError);
        }

        // Assign the name of the error
        this.name = 'Error';
    }

    /**
     * Converts the error object to a formatted string.
     *
     * This method provides a string representation of the `BaseError` instance, including the error name,
     * message, and an enhanced stack trace. It also includes the code block related to the error if available.
     *
     * @returns A string that represents the formatted error message and stack trace.
     */

    toString(): string {
        // Create a header with the error name and message
        let formattedError = __ACTIVE_COLOR ? Colors.Reset : '';
        formattedError += `\n${ this.name }: \n${ this.message }\n\n`;
        if (this.blockCode) {
            formattedError += `${ this.blockCode }\n\n`;
        }

        // Add enhanced stack trace if available
        if( this.stackArray.length > 0)
            formattedError += `Enhanced Stack Trace:\n${ this.stackArray.join('\n') }\n`;

        return formattedError;
    }

    /**
     * Reformats the error stack trace using source map information.
     *
     * This function enhances the original error stack trace by attempting to map each entry
     * back to its original position in the source file using the provided source map service.
     * If the source map information is not available, it returns the original stack trace.
     *
     * @param stack - The original stack trace of the error.
     * @returns The reformatted stack trace or the original stack trace if no mapping is available.
     */

    protected reformatStack(stack: string | undefined): string | undefined {
        if (!stack || !this.sourceMap) {
            return stack;
        }

        // Parse the original stack trace into individual entries
        const stackEntries = parseErrorStack(stack || '');
        this.stackArray = this.getFormattedStackEntries(stackEntries, this.sourceMap);

        // Return the formatted stack trace as a string
        return this.toString();
    }

    /**
     * Gets the formatted stack entries based on the provided source map service.
     *
     * This method processes each stack trace entry, resolves its original position using
     * the source map service, and formats it accordingly. If the source position is available,
     * the corresponding code block is also highlighted.
     *
     * @param stackEntries - An array of stack trace entries.
     * @param sourceMap - The source map service used to resolve the stack trace to original source positions.
     * @returns An array of formatted stack trace entries.
     */

    protected getFormattedStackEntries(stackEntries: StackEntryInterface[], sourceMap: SourceService): string[] {
        return stackEntries.map((item) => {
            const formattedLine = (at: string, file: string, line: number, column: number) =>
                `at ${at} ${setColor(Colors.DarkGray, file)} ${setColor(Colors.Gray, `[${line}:${column}]`)}`;

            if (item.file.includes('node_module')) {
                return formattedLine(item.at, item.file, item.line, item.column);
            }

            const position = resolveSourcePosition(item, sourceMap);
            if (position) {
                this.updateBlockCodeIfNecessary(position);

                const name = position.name ? `${position.name} ` : '';
                const filePath = this.getFilePathWithSourceRoot(position);

                return formattedLine(name, filePath, position.line, position.column);
            }

            if (!item.executor && !item.at.includes('anonymous')) {
                return formattedLine(item.at, item.file, item.line, item.column);
            }

            return '';
        }).filter(entry => entry);
    }

    /**
     * Updates the block code property if it has not been set yet.
     *
     * This method highlights the code snippet associated with the given position and formats it
     * for better readability. The `blockCode` property is only updated once with the highlighted code.
     *
     * @param position - The position object containing the code snippet to be highlighted.
     */

    private updateBlockCodeIfNecessary(position: PositionSourceInterface): void {
        if (!this.blockCode) {
            const highlightedCode = __ACTIVE_COLOR ? highlightCode(position.code) : position.code;
            this.blockCode = formatErrorCode({ ...position, code: highlightedCode }, {
                color: __ACTIVE_COLOR ? Colors.BrightPink : '',
                reset: __ACTIVE_COLOR ? Colors.Reset : ''
            });
        }
    }

    /**
     * Constructs the file path with the source root and line number information.
     *
     * This method ensures that the file path is correctly formatted with the source root (if available)
     * and appends the line number for reference.
     *
     * @param position - The position object containing source file path and source root.
     * @returns The formatted file path with line number.
     */

    private getFilePathWithSourceRoot(position: PositionSourceInterface): string {
        let filePath = position.source;
        if (position.sourceRoot) {
            filePath = filePath.replace(/\.\.\//g, position.sourceRoot) + `#L${ position.line }`;
        }

        return filePath;
    }
}
