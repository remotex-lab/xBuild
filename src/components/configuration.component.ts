/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ParsedCommandLine } from 'typescript';
import type { ArgvInterface } from '@components/interfaces/argv.interface';
import type { ConfigurationInterface } from '@providers/interfaces/configuration.interface';

/**
 * Imports
 */

import ts from 'typescript';
import { dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { parseConfigurationFile, setCliConfiguration } from '@providers/configuration.provider';

/**
 * Asynchronously retrieves the configuration for the application.
 *
 * This function merges the CLI-provided configuration with a user-defined configuration
 * file, if it exists. The resulting configuration object is built by combining default
 * settings with user-defined settings. It ensures that mandatory fields such as
 * `entryPoints` are defined in the final configuration.
 *
 * @param configFile - The path to the user-defined configuration file.
 * @param cli - The command-line arguments object, parsed using `yargs` or a similar library.
 * @returns A promise that resolves to the final configuration object.
 *
 * @throws Error - Throws an error if the `entryPoints` property is undefined in the resulting configuration.
 *
 * @example
 * // Example usage
 * const config = await getConfiguration('path/to/config.file', cliArgs);
 * console.log(config);
 */

export async function getConfiguration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
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
        throw new Error('entryPoints cannot be undefined.');
    }

    return config;
}

/**
 * Reads and parses the TypeScript configuration from the provided tsconfig.json file path.
 *
 * This function performs the following steps:
 * 1. Reads the tsconfig.json file as a string.
 * 2. Parses the JSON content into a valid TypeScript configuration using TypeScript's compiler API.
 * 3. Converts the parsed JSON into a TypeScript compiler configuration (`ParsedCommandLine`).
 *
 * If there are any errors during parsing, it throws an error with a formatted diagnostic message.
 *
 * @param tsConfigPath - The file path to the tsconfig.json file.
 * @returns The parsed TypeScript compiler configuration.
 * @throws Error If the tsconfig.json file has syntax errors or the configuration contains errors.
 */

export function getTsConfiguration(tsConfigPath: string): ParsedCommandLine {
    const configFile = readFileSync(tsConfigPath, 'utf8');
    const configFileJson = ts.parseConfigFileTextToJson(tsConfigPath, configFile);

    if (configFileJson.error) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext([ configFileJson.error ], {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    const configParseResult = ts.parseJsonConfigFileContent(
        configFileJson.config,
        ts.sys,
        dirname(tsConfigPath)
    );

    if (configParseResult.errors.length > 0) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext(configParseResult.errors, {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    return configParseResult;
}

