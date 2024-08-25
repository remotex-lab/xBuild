/**
 * Import will remove at compile time
 */

import type { BuildOptions } from 'esbuild';
import { build } from 'esbuild';

/**
 * Imports
 */

import { cwd } from 'process';
import {
    analyzeDependencies,
    defaultBuildOptions,
    extractSourceMap,
    transpileFile
} from '@core/services/transpiler.service';

jest.mock('esbuild');
const mockedBuild = build as jest.MockedFunction<typeof build>;

/**
 * Test suite for RemoteX Transpiler functions.
 *
 * This suite tests various functions related to transpiling, source map extraction,
 * and dependency analysis using esbuild within the RemoteX Transpiler.
 */

describe('RemoteX Transpiler', () => {

    /**
     * Restore all mocks after the test suite is complete.
     */

    afterAll(() => {
        jest.restoreAllMocks();
    });

    /**
     * Test suite for the `extractSourceMap` function.
     *
     * This suite validates the ability of the `extractSourceMap` function
     * to correctly extract source maps from transpiled code output.
     */

    describe('extractSourceMap', () => {
        /**
         * Test case: Should extract the source map and return the modified code and source map.
         *
         * Verifies that the function correctly identifies and extracts the source map from
         * a string of transpiled code and returns the modified code and the base64-encoded source map.
         */

        test('should extract the source map and return the modified code and source map', () => {
            // eslint-disable-next-line max-len
            const dataString = 'console.log("hello world"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMiLCJzb3VyY2VzIjpbInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyJ9';
            const result = extractSourceMap(dataString);

            expect(result).toEqual({
                code: 'console.log("hello world"); ',
                // eslint-disable-next-line max-len
                sourceMap: 'eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMiLCJzb3VyY2VzIjpbInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyJ9'
            });
        });

        /**
         * Test case: Should throw an error if the source map URL is not found.
         *
         * Verifies that the function throws an appropriate error when the transpiled code
         * does not contain a source map URL.
         */

        test('should throw an error if the source map URL is not found', () => {
            const dataString = 'console.log("hello world");';

            expect(() => extractSourceMap(dataString)).toThrow('Source map URL not found in the output.');
        });
    });

    /**
     * Test suite for the `transpileFile` function.
     *
     * This suite verifies the functionality of the `transpileFile` function,
     * which transpiles TypeScript files to JavaScript and extracts source maps.
     */

    describe('transpileFile', () => {
        const filePath = './src/index.ts';
        // eslint-disable-next-line max-len
        const transpiledCode = 'console.log("hello world"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMiLCJzb3VyY2VzIjpbInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyJ9';

        /**
         * Mocks the `build` function to simulate successful transpilation.
         */

        beforeEach(() => {
            mockedBuild.mockResolvedValue(<any> {
                outputFiles: [{ text: transpiledCode }]
            });
        });

        /**
         * Resets all mocks after each test case.
         */

        afterEach(() => {
            jest.resetAllMocks();
        });

        /**
         * Test case: Should transpile a TypeScript file and extract the source map.
         *
         * Verifies that the `transpileFile` function correctly transpiles a TypeScript file
         * using esbuild and extracts the source map from the transpiled output.
         */

        test('should transpile a TypeScript file and extract the source map', async () => {
            const result = await transpileFile(filePath);

            expect(mockedBuild).toHaveBeenCalledWith(expect.objectContaining({
                absWorkingDir: cwd(),
                ...defaultBuildOptions,
                entryPoints: [ filePath ]
            }));
            expect(result).toEqual({
                code: 'console.log("hello world"); ',
                // eslint-disable-next-line max-len
                sourceMap: 'eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvaW5kZXgudHMiLCJzb3VyY2VzIjpbInNyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyJ9'
            });
        });

        /**
         * Test case: Should use provided build options to override default options.
         *
         * Verifies that the `transpileFile` function allows overriding the default
         * esbuild options with user-provided options.
         */

        test('should use provided build options to override default options', async () => {
            const customOptions: BuildOptions = {
                minify: false
            };

            await transpileFile(filePath, customOptions);

            expect(mockedBuild).toHaveBeenCalledWith(expect.objectContaining({
                absWorkingDir: cwd(),
                ...defaultBuildOptions,
                ...customOptions,
                entryPoints: [ filePath ]
            }));
        });

        /**
         * Test case: Should throw an error if the build process fails.
         *
         * Verifies that the `transpileFile` function throws an appropriate error
         * when the build process fails.
         */

        test('should throw an error if the build process fails', async () => {
            mockedBuild.mockRejectedValue(new Error('Build failed'));

            await expect(transpileFile(filePath)).rejects.toThrow('Build failed');
        });
    });
});


/**
 * Test suite for the `analyzeDependencies` function.
 *
 * This suite tests the functionality of the `analyzeDependencies` function,
 * which analyzes file dependencies using esbuild.
 */

describe('analyzeDependencies', () => {
    const mockMetafile = {
        inputs: {
            'src/index.js': {
                bytes: 1234,
                imports: []
            }
        },
        outputs: {
            'dist/output.js': {
                bytes: 5678,
                imports: []
            }
        }
    };

    /**
     * Mocks the `build` function to simulate successful dependency analysis.
     */

    beforeEach(() => {
        mockedBuild.mockResolvedValue(<any> {
            metafile: mockMetafile
        });
    });

    /**
     * Resets all mocks after each test case.
     */

    afterEach(() => {
        jest.resetAllMocks();
    });

    /**
     * Test case: Should analyze dependencies for a browser platform.
     *
     * Verifies that the `analyzeDependencies` function correctly analyzes
     * dependencies for a browser platform using esbuild.
     */

    test('should analyze dependencies for a browser platform', async () => {
        const entryPoint = './src/index.js';
        const platform = 'browser';

        const result = await analyzeDependencies(entryPoint, platform);

        expect(mockedBuild).toHaveBeenCalledWith(expect.objectContaining({
            entryPoints: [entryPoint],
            bundle: true,
            write: false,
            metafile: true,
            platform: platform,
            logLevel: 'silent'
        }));
        expect(result).toBe(mockMetafile);
    });

    /**
     * Test case: Should analyze dependencies for a node platform.
     *
     * Verifies that the `analyzeDependencies` function correctly analyzes
     * dependencies for a Node.js platform using esbuild.
     */

    test('should analyze dependencies for a node platform', async () => {
        const entryPoint = './src/index.js';
        const platform = 'node';

        const result = await analyzeDependencies(entryPoint, platform);

        expect(mockedBuild).toHaveBeenCalledWith(expect.objectContaining({
            entryPoints: [entryPoint],
            bundle: true,
            write: false,
            metafile: true,
            platform: platform,
            logLevel: 'silent'
        }));
        expect(result).toBe(mockMetafile);
    });

    /**
     * Test case: Should analyze dependencies for a node platform.
     *
     * Verifies that the `analyzeDependencies` function correctly analyzes
     * dependencies for a Node.js platform using esbuild.
     */

    test('should analyze dependencies for a neutral platform', async () => {
        const entryPoint = './src/index.js';
        const platform = 'neutral';

        const result = await analyzeDependencies(entryPoint, platform);

        expect(mockedBuild).toHaveBeenCalledWith(expect.objectContaining({
            entryPoints: [entryPoint],
            bundle: true,
            write: false,
            metafile: true,
            platform: platform,
            logLevel: 'silent'
        }));
        expect(result).toBe(mockMetafile);
    });

    /**
     * Test case: Should throw an error if the build process fails.
     *
     * Verifies that the `analyzeDependencies` function throws an appropriate error
     * when the build process fails.
     */

    test('should throw an error if the build process fails', async () => {
        mockedBuild.mockRejectedValue(new Error('Build failed'));

        await expect(analyzeDependencies('./src/index.js', 'browser')).rejects.toThrow('Build failed');
    });
});
