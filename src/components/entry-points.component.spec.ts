/**
 * Imports
 */

import { xBuildLazy } from '@errors/stack.error';
import { extractEntryPoints } from '@components/entry-points.component';

/**
 * Tests for the `extractEntryPoints` function.
 *
 * The `extractEntryPoints` function processes various formats of entry points and extracts
 * the relevant file paths. These tests verify its correct handling of supported formats
 * and ensure it throws errors for unsupported formats.
 */

describe('ExtractEntryPoints', () => {
    /**
     * Test case to verify that the `extractEntryPoints` function correctly handles an array of objects
     * with `in` and `out` properties. This format should extract the `in` property from each object
     * and use the `out` property as the key in the resulting object.
     *
     * The function is tested with the following entry points:
     * ```typescript
     * const entryPoints = [
     *     { in: 'src/index.ts', out: 'dist/index.js' },
     *     { in: 'src/utils.ts', out: 'dist/utils.js' }
     * ];
     * ```
     * Expected result: The function should return an object mapping the `out` paths to the `in` paths:
     * ```typescript
     * {
     *     'dist/index.js': 'src/index.ts',
     *     'dist/utils.js': 'src/utils.ts'
     * }
     * ```
     */

    test('should handle array of { in: string, out: string }', () => {
        const entryPoints = [
            { in: 'src/index.ts', out: 'dist/index.js' },
            { in: 'src/utils.ts', out: 'dist/utils.js' }
        ];
        expect(extractEntryPoints(entryPoints)).toEqual({
            'dist/index.js': 'src/index.ts',
            'dist/utils.js': 'src/utils.ts'
        });
    });

    /**
     * Test case to verify that the `extractEntryPoints` function correctly handles an array of strings.
     * This format should return an object where the filename (without extension) is the key and
     * the file path is the value.
     *
     * The function is tested with the following entry points:
     * ```typescript
     * const entryPoints = ['src/index.ts', 'src/utils.ts'];
     * ```
     * Expected result: The function should return an object mapping filenames (without extension)
     * to the file paths:
     * ```typescript
     * {
     *     'index': 'src/index.ts',
     *     'utils': 'src/utils.ts'
     * }
     * ```
     */

    test('should handle array of strings', () => {
        const entryPoints = ['src/index.ts', 'src/utils.ts'];
        expect(extractEntryPoints(entryPoints)).toEqual({
            'src/index': 'src/index.ts',
            'src/utils': 'src/utils.ts'
        });
    });

    /**
     * Test case to verify that the `extractEntryPoints` function correctly handles a record object
     * where keys are identifiers and values are file paths. The function should return the same
     * object as the input.
     *
     * The function is tested with the following entry points:
     * ```typescript
     * const entryPoints = {
     *     'index': 'src/index.ts',
     *     'utils': 'src/utils.ts'
     * };
     * ```
     * Expected result: The function should return the input object as is:
     * ```typescript
     * {
     *     'index': 'src/index.ts',
     *     'utils': 'src/utils.ts'
     * }
     * ```
     */

    test('should handle Record<string, string>', () => {
        const entryPoints = {
            'index': 'src/index.ts',
            'utils': 'src/utils.ts'
        };
        expect(extractEntryPoints(entryPoints)).toEqual(entryPoints);
    });

    /**
     * Test case to verify that the `extractEntryPoints` function throws an error when given unsupported formats.
     * The function should throw an error with the message 'Unsupported entry points format' if the format
     * does not match any of the supported types.
     *
     * The function is tested with the following unsupported formats:
     * ```typescript
     * expect(() => extractEntryPoints(123 as any)).toThrow('Unsupported entry points format');
     * expect(() => extractEntryPoints('{}' as any)).toThrow('Unsupported entry points format');
     * expect(() => extractEntryPoints(null as any)).toThrow('Unsupported entry points format');
     * ```
     * Expected result: The function should throw an error with the message 'Unsupported entry points format'.
     */

    test('should throw error for unsupported format', () => {
        const spy = jest.spyOn(xBuildLazy, 'service', 'get').mockReturnValue(<any> {
            file: 'x',
        });

        expect(() => extractEntryPoints(123 as any)).toThrow('Unsupported entry points format');
        expect(() => extractEntryPoints('{}' as any)).toThrow('Unsupported entry points format');
        expect(() => extractEntryPoints(null as any)).toThrow('Unsupported entry points format');
    });
});
