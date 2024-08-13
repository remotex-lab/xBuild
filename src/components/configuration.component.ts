/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { Module } from 'node:module';
import type { ArgvInterface } from '@components/interfaces/argv.interface';
import type { ConfigurationInterface, ModuleInterface } from '@components/interfaces/configuration.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { existsSync, readFileSync } from 'fs';
import { sandboxExecute } from '@providers/vm.provider';
import { transpileFile } from '@core/services/transpiler.service';
import ts, { type ParsedCommandLine } from 'typescript';
import { dirname } from 'path';

/**
 * The default configuration settings.
 */

export const defaultConfiguration: ConfigurationInterface = {
    dev: false,
    watch: false,
    declaration: false,
    buildOnError: false,
    noTypeChecker: false,
    defines: {},
    esbuild: {
        write: true,
        bundle: true,
        minify: true,
        format: 'esm',
        outdir: 'dist',
        platform: 'browser',
        absWorkingDir: cwd(),
        loader: {
            '.js': 'ts'
        }
    },
    serve: {
        port: 3000,
        host: '0.0.0.0',
        active: false
    }
};

/**
 * Parses a configuration file by transpiling it and executing the resulting JavaScript code in a sandboxed environment.
 * The function returns the parsed configuration object.
 *
 * @param configFile - The path to the configuration file to parse.
 * @returns A promise that resolves to the parsed configuration object.
 */

export async function parseConfigurationFile(configFile: string): Promise<ConfigurationInterface> {
    const { code } = await transpileFile(configFile, {
        banner: {
            js: '(function(module, exports) {'
        },
        footer: {
            js: '})(module, module.exports);'
        }
    });

    const module: ModuleInterface = { exports: {} };
    const cjsModule: typeof Module = <any> await import('module');
    const require = cjsModule.createRequire(import.meta.url);

    await sandboxExecute(code, {
        require,
        module
    });

    return <ConfigurationInterface> module.exports.default;
}

/**
 * Retrieves the configuration by either parsing a specified configuration file or returning the default configuration.
 * If the configuration file does not exist, the function returns the default configuration merged with the parsed configuration.
 *
 * @param configFile - The path to the configuration file to retrieve.
 * @param cli - The command-line arguments passed to the application, which can be used to override or extend the configuration.
 * @returns A promise that resolves to the retrieved configuration object.
 */

export async function getConfiguration(configFile: string, cli: Argv<ArgvInterface>): Promise<ConfigurationInterface> {
    const args = <ArgvInterface> cli.argv;
    let config: ConfigurationInterface = {
        ...defaultConfiguration,
        dev: args.dev,
        watch: args.watch,
        declaration: args.declaration,
        esbuild: {
            ...defaultConfiguration.esbuild,
            bundle: args.bundle,
            minify: args.minify,
            outdir: args.outdir,
            tsconfig: args.tsconfig,
        },
        serve: {
            ...defaultConfiguration.serve,
            active: args.serve
        }
    };

    if (args.file) {
        config.esbuild.entryPoints = [ args.file ];
    }

    if (args.node) {
        config.esbuild.target = [ `node${ process.version.slice(1) }` ];
        config.esbuild.platform = 'node';
    }

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


export function readTsConfig(tsConfigPath: string): ParsedCommandLine {
    // Step 1: Read the tsconfig.json file
    const configFile = readFileSync(tsConfigPath, 'utf8');

    // Step 2: Parse the tsconfig.json file
    const configFileJson = ts.parseConfigFileTextToJson(tsConfigPath, configFile);

    if (configFileJson.error) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext([configFileJson.error], {
            getCurrentDirectory: ts.sys.getCurrentDirectory,
            getCanonicalFileName: fileName => fileName,
            getNewLine: () => ts.sys.newLine
        }));
    }

    // Convert the parsed JSON into a TypeScript compiler configuration
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
