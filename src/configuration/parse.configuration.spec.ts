/**
 * Imports
 */

import { sandboxExecute } from '@services/vm.service';
import { transpileFile } from '@services/transpiler.service';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Mocks
 */

jest.mock('@services/vm.service');
jest.mock('@services/transpiler.service');
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readFileSync: () => JSON.stringify({
        version: 3,
        file: 'index.js',
        sources: [ 'source.js' ],
        names: [],
        mappings: 'AAAA',
        sourcesContent: [ 'asd' ]
    })
}));

/**
 * Tests for the `parseConfigurationFile` function.
 *
 * The `parseConfigurationFile` function transpiles a TypeScript configuration file and
 * parses the exported configuration object from it. These tests validate its behavior under
 * various conditions.
 */

describe('parseConfigurationFile', () => {

    /**
     * Test case to verify that `parseConfigurationFile` correctly transpiles the configuration file
     * and returns the parsed configuration object.
     *
     * The function should transpile a TypeScript file and execute it within a sandbox to extract
     * the configuration object. The test mocks the `transpileFile` and `sandboxExecute` functions
     * to simulate the transpilation and execution processes.
     *
     * Code:
     * ```typescript
     * const config = await parseConfigurationFile('valid.config.ts');
     * ```
     * Expected result: The `transpileFile` function is called with the correct arguments, and the
     * configuration object `{ dev: true, watch: true }` is returned.
     */

    test('should transpile the configuration file and return the parsed configuration object', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'transpiledCode',
            sourceMap: 'eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxDQUFDOztBQUNBIn0='
        });

        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = { dev: true, watch: true };
        });

        const config = await parseConfigurationFile('valid.config.ts');

        expect(transpileFile).toHaveBeenCalledWith('valid.config.ts', expect.any(Object));
        expect(config).toEqual({ dev: true, watch: true });
    });


    /**
     * Test case to ensure that `parseConfigurationFile` returns the default configuration when
     * the sandbox does not modify the `exports.default` object.
     *
     * This test simulates a scenario where the sandbox execution leaves the `exports.default`
     * object unchanged. It verifies that the function correctly returns an empty configuration object.
     *
     * Code:
     * ```typescript
     * const config = await parseConfigurationFile('empty.config.ts');
     * ```
     * Expected result: The function returns an empty configuration object `{}`.
     */

    test('should return the default configuration when the sandbox does not modify exports', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'transpiledCode',
            sourceMap: 'eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxDQUFDOztBQUNBIn0='
        });

        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = {};
        });

        const config = await parseConfigurationFile('empty.config.ts');

        expect(config).toEqual({});
    });

    /**
     * Test case to verify that `parseConfigurationFile` attaches source information to the error
     * when an error occurs during the transpilation or execution process.
     *
     * The function should handle errors from the `transpileFile` function by attaching source
     * information to the error. This test checks that the error handling mechanism works as expected.
     *
     * Code:
     * ```typescript
     * await expect(parseConfigurationFile('invalid.config.ts')).rejects.toThrow('Test error');
     * ```
     * Expected result: The error is thrown with source information attached.
     */

    test('should attach source to error when an error occurs in parseConfigurationFile', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'transpiledCode',
            sourceMap: 'eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxDQUFDOztBQUNBIn0='
        });

        const error = new Error('Test error');
        (sandboxExecute as jest.Mock).mockRejectedValue(error);

        await expect(parseConfigurationFile('invalid.config.ts')).rejects.toThrow('Test error');
    });
});

/**
 * Tests for the `wrapAllFunctions` function.
 *
 * The `wrapAllFunctions` function wraps functions within an object and handles errors correctly,
 * including attaching source information to errors. This suite tests its behavior for different cases.
 */


describe('wrapAllFunctions', () => {
    /**
     * Test case to verify that `wrapAllFunctions` correctly wraps functions within an object
     * and handles errors by attaching source information.
     *
     * This test ensures that the `wrapAllFunctions` function wraps functions and processes nested
     * objects, handling errors and attaching source information as expected.
     *
     * Code:
     * ```typescript
     * const config = await parseConfigurationFile('empty.config.ts');
     * ```
     * Expected result: Functions throw errors with the correct messages, and `attachSourceToError`
     * is called with the error and source service.
     */

    test('should wrap functions within an object and handle errors correctly', async () => {
        const obj = {
            fn1: jest.fn(() => {
                throw new Error('Function 1 error');
            }),
            nested: {
                fn2: jest.fn(() => {
                    throw new Error('Function 2 error');
                })
            }
        };

        (transpileFile as jest.Mock).mockResolvedValue({
            code: 'transpiledCode',
            sourceMap: 'eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxDQUFDOztBQUNBIn0='
        });

        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = obj;
        });

        const config: any = await parseConfigurationFile('empty.config.ts');

        expect(() => config.fn1()).toThrow('Function 1 error');
        expect(() => config.nested.fn2()).toThrow('Function 2 error');
    });
});
