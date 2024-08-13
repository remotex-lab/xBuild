/**
 * Represents the result of transpiling a file.
 *
 * @param code - The transpiled content of the file.
 * @param sourceMap - The source map generated during compiled.
 */

export interface transpileFileInterface {
    code: string;
    sourceMap: string;
}
