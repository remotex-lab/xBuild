/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';

/**
 * Imports
 */

import { sandboxExecute } from '@providers/vm.provider';
import { transpileFile } from '@services/transpiler.service';
import { defaultConfiguration, parseConfigurationFile, setCliConfiguration } from '@providers/configuration.provider';

/**
 * Mocks
 */

jest.mock('@providers/vm.provider');
jest.mock('@core/services/transpiler.service');

/**
 * Test suite for `setCliConfiguration` function.
 *
 * This suite verifies the behavior of the `setCliConfiguration` function,
 * which merges user-provided CLI arguments with a default configuration.
 */

describe('setCliConfiguration', () => {
    let cli: Argv<any>;

    /**
     * Sets up a mock `cli` object before each test case.
     * The `cli` object simulates different sets of CLI arguments.
     */

    beforeEach(() => {
        cli = {
            argv: {}
        } as unknown as Argv<any>; // Mock yargs.Argv
    });

    /**
     * Test case: Should return the default configuration when no arguments are provided.
     *
     * Verifies that `setCliConfiguration` returns the default configuration object when
     * no CLI arguments are specified.
     */

    test('should return default configuration when no arguments are provided', () => {
        const result = setCliConfiguration(cli);
        expect(result).toEqual(defaultConfiguration);
    });

    /**
     * Test case: Should override default values with provided CLI arguments.
     *
     * Verifies that `setCliConfiguration` correctly overrides the default configuration
     * with user-provided CLI arguments.
     */

    test('should override default values with provided CLI arguments', () => {
        cli.argv = {
            dev: true,
            watch: true,
            declaration: true,
            bundle: false,
            minify: true,
            outdir: 'build',
            tsconfig: 'custom-tsconfig.json',
            file: 'index.ts',
            node: true,
            serve: true
        } as unknown as Argv<any>;

        const expectedConfig = {
            ...defaultConfiguration,
            dev: true,
            watch: true,
            declaration: true,
            esbuild: {
                ...defaultConfiguration.esbuild,
                bundle: false,
                minify: true,
                outdir: 'build',
                tsconfig: 'custom-tsconfig.json',
                entryPoints: [ 'index.ts' ],
                target: [ `node${ process.version.slice(1) }` ],
                platform: 'node'
            },
            serve: {
                ...defaultConfiguration.serve,
                active: true
            }
        };

        const result = setCliConfiguration(cli);
        expect(result).toEqual(expectedConfig);
    });

    /**
     * Test case: Should handle missing optional arguments gracefully.
     *
     * Verifies that `setCliConfiguration` handles cases where some optional arguments
     * are missing by falling back to the default configuration values.
     */

    test('should handle missing optional arguments gracefully', () => {
        cli.argv = {
            file: 'app.ts'
        } as unknown as Argv<any>;

        const expectedConfig = {
            ...defaultConfiguration,
            esbuild: {
                ...defaultConfiguration.esbuild,
                entryPoints: [ 'app.ts' ]
            }
        };

        const result = setCliConfiguration(cli);
        expect(result).toEqual(expectedConfig);
    });

    /**
     * Test case: Should set Node.js target and platform when `node` argument is provided.
     *
     * Verifies that `setCliConfiguration` correctly sets the `target` and `platform` properties
     * for esbuild when the `node` argument is specified in the CLI arguments.
     */

    test('should set Node.js target and platform when `node` argument is provided', () => {
        cli.argv = {
            node: true
        } as unknown as Argv<any>;

        const expectedConfig = {
            ...defaultConfiguration,
            esbuild: {
                ...defaultConfiguration.esbuild,
                target: [ `node${ process.version.slice(1) }` ],
                platform: 'node'
            }
        };

        const result = setCliConfiguration(cli);
        expect(result).toEqual(expectedConfig);
    });
});

/**
 * Test suite for the `parseConfigurationFile` function.
 *
 * This suite tests the functionality of the `parseConfigurationFile` function,
 * which is responsible for transpiling a TypeScript configuration file and
 * parsing the exported configuration object from it.
 */

describe('parseConfigurationFile', () => {

    /**
     * Test case: Should transpile the configuration file and return the parsed configuration object.
     *
     * This test validates that the `parseConfigurationFile` function correctly transpiles a
     * TypeScript configuration file and returns the expected parsed configuration object.
     * It mocks the `transpileFile` function to return a string representing the transpiled code.
     * The `sandboxExecute` function is also mocked to modify the `exports.default` object within
     * the provided context to simulate the result of executing the transpiled code.
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
     * Test case: Should return the default configuration when the sandbox does not modify exports.
     *
     * This test checks that the `parseConfigurationFile` function returns an empty configuration object
     * when the sandbox execution does not modify the `exports.default` object. It mocks the `transpileFile`
     * function to simulate successful transpilation and the `sandboxExecute` function to leave the `exports.default`
     * object empty, simulating the scenario where no configuration is provided in the file.
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
});


