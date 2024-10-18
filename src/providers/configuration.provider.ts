/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { BuildOptions } from 'esbuild';
import type { ParsedCommandLine } from 'typescript';
import type { ArgvInterface } from '@services/interfaces/cli.interface';
import type { ConfigurationInterface, PartialDeep } from '@configuration/interfaces/configuration.interface';

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

const defaultTsConfig = JSON.stringify({
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
 * @param cli - An instance of `Argv<ArgvInterface>` that contains CLI arguments and options.
 * @returns The final configuration object as a `ConfigurationInterface`.
 * @throws Error - Throws an error if critical configuration properties are missing or invalid.
 */

function parseCliArgs(cli: Argv<ArgvInterface>): PartialDeep<ConfigurationInterface> {
    const args = <ArgvInterface> cli.argv;

    // Helper function to filter out undefined values
    const pickDefined = <T extends object>(obj: T): PartialDeep<ConfigurationInterface> => Object.fromEntries(
        Object.entries(obj).filter(([ , value ]) => value !== undefined)
    );

    const esbuildConfig = pickDefined({
        bundle: args.bundle,
        minify: args.minify,
        outdir: args.outdir,
        tsconfig: args.tsconfig,
        entryPoints: args.file ? [ args.file ] : undefined,
        target: args.node ? [ `node${ process.version.slice(1) }` ] : undefined,
        platform: args.node ? 'node' : undefined
    });

    return <PartialDeep<ConfigurationInterface>> {
        ...pickDefined({
            dev: args.dev,
            watch: args.watch,
            declaration: args.declaration,
            serve: args.serve ? { active: args.serve } : { undefined }
        }),
        ... { esbuild: esbuildConfig }
    };
}

/**
 * Reads and parses the TypeScript configuration file.
 *
 * @param options - A `BuildOptions` object that may contain a custom `tsconfig` path.
 * @returns A `ParsedCommandLine` object representing the parsed TypeScript configuration.
 * @throws xBuildError - Throws an error if the configuration file contains syntax errors.
 */

export function tsConfiguration(options: BuildOptions): ParsedCommandLine {
    const tsConfigFile = options.tsconfig ?? '';
    const configFile = existsSync(tsConfigFile) ? readFileSync(tsConfigFile, 'utf8') : JSON.stringify(defaultTsConfig);

    const parsedConfig = ts.parseConfigFileTextToJson(tsConfigFile, configFile);
    if (parsedConfig.error) {
        throw new xBuildError(ts.formatDiagnosticsWithColorAndContext([ parsedConfig.error ], {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    const configParseResult = ts.parseJsonConfigFileContent(parsedConfig.config, ts.sys, dirname(tsConfigFile));
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
 * @param configFile - The path to the configuration file to read and merge with CLI arguments.
 * @param cli - An instance of `Argv<ArgvInterface>` containing CLI arguments and options.
 * @returns A promise that resolves to the final `ConfigurationInterface` object.
 * @throws Error - Throws an error if the `entryPoints` property in the final configuration is undefined.
 */

export async function configuration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
    const cliConfig = parseCliArgs(cli);
    const userConfig = existsSync(configFile) ? await parseConfigurationFile(configFile) : <PartialDeep<ConfigurationInterface>> {};

    const mergedConfig: ConfigurationInterface = {
        ...defaultConfiguration,
        ...userConfig,
        ...cliConfig,
        esbuild: {
            ...defaultConfiguration.esbuild,
            ...userConfig?.esbuild,
            ...cliConfig.esbuild
        },
        serve: {
            ...defaultConfiguration.serve,
            ...userConfig.serve,
            ...cliConfig.serve
        }
    };

    if (!mergedConfig.esbuild.entryPoints) {
        throw new xBuildError('entryPoints cannot be undefined.');
    }

    return mergedConfig;
}
