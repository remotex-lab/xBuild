/**
 * Import will remove at compile time
 */

import type { SourceService } from '@remotex-labs/xmap';

/**
 * Represents a parsed error object with optional details.
 *
 * This interface is used to define the structure of an error object that
 * may include an error message, a stack trace, and an optional source service
 * for retrieving source positions in the code.
 */

export interface ParsedErrorInterface {
    /**
     * The error message associated with the error.
     * This is a human-readable string describing the error.
     */

    message?: string;

    /**
     * The stack trace of the error as a string.
     * This property typically contains information about the call stack at the time
     * the error was thrown, useful for debugging purposes.
     */

    stack?: string;

    /**
     * An optional source service used to retrieve source positions
     * related to the error. This service can provide information about
     * where the error occurred in the original source code.
     */

    source?: SourceService;
}
