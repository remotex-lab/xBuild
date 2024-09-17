/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { BuildOptions } from 'esbuild';
import type { ParsedCommandLine } from 'typescript';
import type { ArgvInterface } from '@services/interfaces/cli.interface';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import ts from 'typescript';
import { dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { xBuildError } from '@errors/xbuild.error';
import { defaultConfiguration } from '@configuration/default.configuration';
import { parseConfigurationFile } from '@configuration/parse.configuration';

/**
 * Default tsconfig if not supplied
 */

const tsConfigDefault = JSON.stringify({
    'compilerOptions': {
        'strict': true,
        'target': 'ESNext',
        'module': 'ESNext',
        'outDir': 'dist',
        'skipLibCheck': true,
        'isolatedModules': false,
        'esModuleInterop': false,
        'moduleDetection': 'force',
        'moduleResolution': 'node',
        'resolveJsonModule': true,
        'allowSyntheticDefaultImports': true,
        'forceConsistentCasingInFileNames': true
    }
});

/**
 * Parses CLI arguments and sets the configuration for the application.
 *
 * This function takes an instance of `Argv` (from `yargs` or a similar library) and extracts the configuration values from it.
 * It then merges these values with default settings to produce a final configuration object of type `ConfigurationInterface`.
 *
 * @param cli - An instance of `Argv<ArgvInterface>` that contains CLI arguments and options. This should match the
 * `ArgvInterface` which defines the shape of CLI arguments supported by the application.
 *
 * @returns The final configuration object as a `ConfigurationInterface`, combining default values with those
 * provided via CLI arguments. This object is used to configure the application,
 * particularly for tasks related to esbuild, development settings, and other build options.
 *
 * @throws Error - Throws an error if critical configuration properties are missing or invalid.
 *
 * @example
 * ``` typescript
 * // Example usage:
 * import { Argv } from 'yargs';
 * import { setCliConfiguration } from './path-to-your-function';
 *
 * const argv = yargs.argv as Argv<ArgvInterface>;
 * try {
 *     const config = setCliConfiguration(argv);
 *     console.log(config);
 * } catch (error) {
 *     console.error('Error setting CLI configuration:', error);
 * }
 * ```
 */

function setCliConfiguration(cli: Argv<ArgvInterface>): ConfigurationInterface {
    const args = <ArgvInterface> cli.argv;
    const config: ConfigurationInterface = {
        ...defaultConfiguration,
        dev: args.dev ?? defaultConfiguration.dev,
        watch: args.watch ?? defaultConfiguration.watch,
        declaration: args.declaration ?? defaultConfiguration.declaration,
        esbuild: {
            ...defaultConfiguration.esbuild,
            bundle: args.bundle ?? defaultConfiguration.esbuild.bundle,
            minify: args.minify ?? defaultConfiguration.esbuild.minify,
            outdir: args.outdir ?? defaultConfiguration.esbuild.outdir,
            tsconfig: args.tsconfig ?? defaultConfiguration.esbuild.tsconfig
        },
        serve: {
            ...defaultConfiguration.serve,
            active: args.serve ?? defaultConfiguration.serve.active
        }
    };

    // Set entry points if specified
    if (args.file) {
        config.esbuild.entryPoints = [ args.file ];
    }

    // Set target and platform for esbuild if `node` is specified
    if (args.node) {
        config.esbuild.target = [ `node${ process.version.slice(1) }` ];
        config.esbuild.platform = 'node';
    }

    return config;
}

/**
 * Reads and parses the TypeScript configuration file (e.g., `tsconfig.json`), returning a `ParsedCommandLine` object.
 * This function handles the file reading and parsing, and throws detailed errors if any issues are encountered during
 * the parsing process, such as syntax errors or other invalid configurations.
 *
 * If a specific `tsconfig` path is provided in the `options`, it attempts to read from that file. If no file is found
 * or provided, it defaults to using a pre-defined configuration. It also supports setting the `tsconfigRaw` option with
 * default configurations when no file is available.
 *
 * @param options - A `BuildOptions` object that may contain a custom `tsconfig` path. If a valid `tsconfig` path is
 * provided and exists, the file is read and parsed. Otherwise, the function will fall back to the default configuration.
 *
 * @returns A `ParsedCommandLine` object representing the parsed TypeScript configuration.
 *
 * @throws {xBuildError} Throws an error if the configuration file contains syntax errors or any parsing issues.
 * The error provides detailed diagnostic information formatted with color and context.
 *
 * @example
 * // Example usage:
 * try {
 *     const parsedConfig = tsConfiguration({ tsconfig: 'tsconfig.json' });
 *     console.log(parsedConfig);
 * } catch (error) {
 *     console.error('Error parsing TypeScript configuration:', error);
 * }
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/tsconfig-json.html TypeScript Handbook} for more information on `tsconfig.json`.
 */

export function tsConfiguration(options: BuildOptions): ParsedCommandLine {
    let configFile = tsConfigDefault;
    const tsConfigFile = options.tsconfig ?? '';

    if(tsConfigFile && existsSync(tsConfigFile)) {
        configFile = readFileSync(tsConfigFile, 'utf8');
    } else {
        delete options.tsconfig;
        options.tsconfigRaw = tsConfigDefault;
    }

    const configFileJson = ts.parseConfigFileTextToJson(tsConfigFile, configFile);
    if (configFileJson.error) {
        throw new xBuildError(ts.formatDiagnosticsWithColorAndContext([ configFileJson.error ], {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    const configParseResult = ts.parseJsonConfigFileContent(
        configFileJson.config,
        ts.sys,
        dirname(tsConfigFile)
    );

    if (configParseResult.errors.length > 0) {
        throw new xBuildError(ts.formatDiagnosticsWithColorAndContext(configParseResult.errors, {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    return configParseResult;
}

/**
 * Merges CLI arguments with a configuration file to produce a final configuration object.
 *
 * This function initializes the configuration using CLI arguments, and if a configuration file is specified
 * and exists, it extends or overrides the initial configuration with values from the file. The final configuration
 * is validated to ensure that critical fields are defined.
 *
 * @param configFile - The path to the configuration file to read and merge with CLI arguments. This file should
 *                     be in a format that can be parsed by `parseConfigurationFile`.
 * @param cli - An instance of `Argv<ArgvInterface>` containing CLI arguments and options.
 *
 * @returns A promise that resolves to the final `ConfigurationInterface` object, combining defaults, CLI arguments,
 *          and configuration file values.
 *
 * @throws Error - Throws an error if the `entryPoints` property in the final configuration is undefined.
 *
 * @see {@link ../configuration/parse.configuration.ts } for the function that parses the configuration file.
 *
 * @example
 * // Example usage:
 * import { Argv } from 'yargs';
 * import { configuration } from './path-to-your-function';
 *
 * const argv = yargs.argv as Argv<ArgvInterface>;
 *
 * configuration('path/to/config/file.json', argv)
 *     .then(config => {
 *         console.log('Final configuration:', config);
 *     })
 *     .catch(error => {
 *         console.error('Error configuring:', error);
 *     });
 */

export async function configuration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
    let config = setCliConfiguration(cli);

    if (existsSync(configFile)) {
        const userConfig = await parseConfigurationFile(configFile);

        if (userConfig) {
            config = {
                ...config,
                ...userConfig,
                esbuild: {
                    ...config.esbuild,
                    ...userConfig.esbuild
                },
                serve: {
                    ...config.serve,
                    ...userConfig.serve
                }
            };
        }
    }

    if (!config.esbuild.entryPoints) {
        throw new xBuildError('entryPoints cannot be undefined.');
    }

    return config;
}
