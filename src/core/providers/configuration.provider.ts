/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@components/interfaces/argv.interface';
import type { ConfigurationInterface, ModuleInterface } from '@providers/interfaces/configuration.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import type * as Module from 'node:module';
import { SourceService } from '@remotex-labs/xmap';
import { sandboxExecute } from '@providers/vm.provider';
import { transpileFile } from '@services/transpiler.service';

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
        format: 'cjs',
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
 * Configures settings based on CLI arguments.
 *
 * @param cli - The CLI arguments object.
 * @returns The resulting configuration object.
 */

export function setCliConfiguration(cli: Argv<ArgvInterface>): ConfigurationInterface {
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
 * Wraps all functions in the configuration object to enhance errors with sourcemap.
 *
 * @param config - The configuration object.
 * @param sourceMap - The sourcemap service or data used for enhancing errors.
 * @returns The configuration object with wrapped functions.
 */

function wrapConfigFunctionsWithSourcemap(
    config: ConfigurationInterface,
    sourceMap: SourceService
): ConfigurationInterface {
    const wrapFunction = <T extends (...args: unknown[]) => unknown>(fn: T): T => {
        return ((...args: Parameters<T>): ReturnType<T> => {
            try {
                return <any> fn(...args);
            } catch (error: any) {
                if (error && typeof error === 'object') {
                    error.source = sourceMap;
                }
                throw error;
            }
        }) as T;
    };

    for (const key in config) {
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            const value = config[key as keyof ConfigurationInterface];
            if (typeof value === 'function') {
                config[key as keyof ConfigurationInterface] = wrapFunction(value) as any;
            }
        }
    }

    return config;
}

/**
 * Parses a configuration file by transpiling it and executing the resulting JavaScript code in a sandboxed environment.
 * The function returns the parsed configuration object.
 *
 * @param configFile - The path to the configuration file to parse.
 * @returns A promise that resolves to the parsed configuration object.
 */

export async function parseConfigurationFile(configFile: string): Promise<ConfigurationInterface> {
    const { code, sourceMap } = await transpileFile(configFile, {
        banner: { js: '(function(module, exports) {' },
        footer: { js: '})(module, module.exports);' }
    });

    const module: ModuleInterface = { exports: {} };
    const cjsModule = <typeof Module> <unknown> await import('module');
    const require = cjsModule.createRequire(import.meta.url);
    const source = new SourceService(JSON.parse(atob(sourceMap)));

    try {
        await sandboxExecute(code, {
            require,
            module
        });

        return wrapConfigFunctionsWithSourcemap(<ConfigurationInterface> module.exports.default, source);
    } catch (e: any) {
        e.source = source;
        throw e;
    }
}
