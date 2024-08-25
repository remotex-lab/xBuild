/**
 * Import will remove at compile time
 */

import type { ParsedErrorInterface } from '@providers/interfaces/error.interface';
import type { PositionSourceInterface, StackEntryInterface } from '@remotex-labs/xmap';

/**
 * Imports
 */

import { join } from 'path';
import { readFileSync } from 'fs';
import {
    Colors,
    SourceService,
    highlightCode,
    formatErrorCode,
    parseErrorStack
} from '@remotex-labs/xmap';

/**
 * Constants
 */

const dirname = import.meta.dirname;
const sourceMapData = readFileSync(join(dirname, 'index.js.map'));
const defaultSourceService = new SourceService(JSON.parse(sourceMapData.toString()));

/**
 * Resolves the source position for a given stack entry.
 * Falls back to the default source service if necessary.
 *
 * @param stackEntry - A single entry from the stack trace.
 * @param sourceService - The primary source service to resolve the position.
 * @returns The resolved position or undefined if not found.
 */

function resolveSourcePosition(stackEntry: StackEntryInterface, sourceService: SourceService): PositionSourceInterface | null {
    const service = (stackEntry.file.includes('evalmachine') || stackEntry.file.includes('node:vm'))
        ? sourceService
        : defaultSourceService;

    return service.getSourcePosition(stackEntry.line, stackEntry.column);
}

/**
 * Logs the stack trace entries to the console.
 *
 * @param stack - An array of stack entries.
 * @param sourceService - The source service used to resolve source positions.
 */

export function logStackTrace(stack: Array<StackEntryInterface>, sourceService: SourceService): void {
    stack.forEach((item) => {
        const position = resolveSourcePosition(item, sourceService);

        if (position) {
            let filePath = position.source;
            if (position.sourceRoot) {
                filePath = filePath.replace('../', position.sourceRoot) + `#L${position.line}`;
            }

            console.log(`at ${filePath} [${position.line}:${position.column}]`);
        }
    });
}

/**
 * Logs detailed error information, including code snippets and stack traces.
 *
 * @param error - The parsed error object.
 * @param sourceService - The source service used to resolve source positions.
 */

export function logErrorDetails(error: ParsedErrorInterface, sourceService: SourceService): void {
    const stack = parseErrorStack(error.stack || '');
    const errorPosition = stack.shift();

    if (!errorPosition) {
        console.log(error);

        return;
    }

    const errorSource = sourceService.getSourcePosition(errorPosition.line, errorPosition.column) as PositionSourceInterface;
    if (!errorSource) {
        console.log(error);

        return;
    }

    const highlightedCode = highlightCode(errorSource.code);
    const formattedCode = formatErrorCode({ ...errorSource, code: highlightedCode }, {
        color: Colors.brightPink,
        reset: Colors.reset
    });

    console.log(`\n${formattedCode}\n`);
    console.log(`Error: ${Colors.brightPink}${error.message}${Colors.reset}`);
    console.log(`At file: ${errorSource.source}\n\nStack:`);
    logStackTrace(stack, sourceService);
}

/**
 * Parses and logs error details using the default source service.
 *
 * @param error - The parsed error object.
 */

export function errorParser(error: ParsedErrorInterface): void {
    logErrorDetails(error, defaultSourceService);
}

/**
 * Handles and logs error information based on the provided error object.
 *
 * @param error - The error object, which can be of any type.
 */

export function errorHandler(error: unknown): void {
    if (typeof error !== 'object' || error === null) {
        console.log('Unknown error:', error);

        return;
    }

    const { source, stack } = error as ParsedErrorInterface;

    if (source && stack) {
        const stackEntries = parseErrorStack(stack);
        if (stackEntries.length) {
            logErrorDetails(error as ParsedErrorInterface, source);

            return;
        }
    }

    errorParser(error as ParsedErrorInterface);
}
