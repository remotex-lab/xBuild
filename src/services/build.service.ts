/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams } from 'child_process';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';
import type { BuildContext, BuildResult, Message, Metafile, OnEndResult, PluginBuild, SameShape } from 'esbuild';

/**
 * Imports
 */

import { dirname, resolve } from 'path';
import { build, context } from 'esbuild';
import { spawn } from '@services/process.service';
import { esBuildError } from '@errors/esbuild.error';
import { prefix } from '@components/banner.component';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { ServerProvider } from '@providers/server.provider';
import { PluginsProvider } from '@providers/plugins.provider';
import { parseIfDefConditionals } from '@plugins/ifdef.plugin';
import { Colors, setColor } from '@components/colors.component';
import { resolveAliasPlugin } from '@plugins/resolve-alias.plugin';
import { analyzeDependencies } from '@services/transpiler.service';
import { TypeScriptProvider } from '@providers/typescript.provider';
import { tsConfiguration } from '@providers/configuration.provider';
import { extractEntryPoints } from '@components/entry-points.component';
import { packageTypeComponent } from '@components/package-type.component';

/**
 * Manages the build process for a TypeScript project using esbuild.
 *
 * The `BuildService` class orchestrates the build process, including TypeScript compilation, handling of build errors,
 * and lifecycle management of the build. It can operate in various modes, such as watching for file changes or running
 * in development mode. It also provides functionality for spawning development processes and processing entry points.
 *
 * @remarks
 * - The build process can be configured using the provided `ConfigurationInterface`.
 * - Errors related to TypeScript are handled separately and are not logged by default.
 * - The class supports various build modes, including watch mode and development mode, and handles different scenarios
 *   based on the configuration.
 *
 * @public
 * @category Services
 */

export class BuildService {
    /**
     * Provides TypeScript-related functionality for the build process.
     */

    readonly typeScriptProvider: TypeScriptProvider;

    /**
     * Keeps track of active development processes spawned during the build.
     * This property holds an array of `ChildProcessWithoutNullStreams` instances that represent Node.js processes spawned
     * for running development tasks. These processes are used to handle development builds or runtime tasks and are managed
     * by the `BuildService` class to ensure they are properly started and stopped.
     *
     * @private
     * @type {Array<ChildProcessWithoutNullStreams>}
     *
     * @remarks
     * - The array is populated when development processes are spawned, such as when specific development files are
     *   processed or when running in development mode.
     * - The processes are terminated gracefully at the end of the build to avoid leaving orphaned processes running.
     * - It is important to manage these processes correctly to avoid resource leaks and ensure proper cleanup.
     */

    private activePossess: Array<ChildProcessWithoutNullStreams> = [];

    /**
     * Plugin provider
     *
     * @private
     */

    private pluginsProvider: PluginsProvider;

    /**
     * Initializes the build service with the provided configuration.
     *
     * The constructor configures the TypeScript provider, suppresses esbuild logging,
     * sets up development modes, and registers the necessary plugins.
     *
     * Declaration files will be output based on the following order of precedence:
     * 1. If `declarationOutDir` is set in the configuration, it will be used.
     * 2. If `declarationOutDir` is not provided, it will use the `outDir` value from the tsconfig.
     * 3. If neither of the above is available, it falls back to using the `outdir` specified in the esbuild configuration.
     *
     * @param config - The configuration object for the build process, including esbuild and TypeScript settings.
     */

    constructor(private config: ConfigurationInterface) {
        const tsConfig = tsConfiguration(this.config.esbuild);

        this.config.esbuild.logLevel = 'silent';
        this.pluginsProvider = new PluginsProvider();
        this.typeScriptProvider = new TypeScriptProvider(
            tsConfig, this.config.declarationOutDir ?? tsConfig.options.outDir ?? this.config.esbuild.outdir!
        );

        this.configureDevelopmentMode();
        this.setupPlugins();
    }

    /**
     * Executes the build process.
     * This method performs the build and handles any errors that occur. If watching or development mode is enabled,
     * it starts watching for changes. It logs errors that are not related to TypeScript.
     *
     * @returns A promise that resolves when the build process is complete.
     *
     * @throws {Error} Throws an error if the build process encounters issues not related to TypeScript.
     *
     * @example
     * ```typescript
     * import { BuildService } from './build-service';
     *
     * const buildService = new BuildService(config);
     * buildService.run().then(() => {
     *     console.log('Build process completed successfully.');
     * }).catch((error) => {
     *     console.error('Build process failed:', error);
     * });
     * ```
     *
     * In this example, the `run` method is used to execute the build process. It handles both successful completion
     * and errors.
     */

    async run(): Promise<void> {
        return await this.execute(async () => {
            const result = await this.build();
            if (this.config.watch || this.config.dev) {
                await (<BuildContext> result).watch();
            }
        });
    }

    /**
     * Runs the build process in debug mode for the specified entry points.
     * This method temporarily disables development and watch mode, initiates the build process, and spawns development processes
     * for the specified entry points. If any errors occur during the build, they are handled appropriately.
     *
     * @param entryPoints - An array of entry point file names for which the development processes will be spawned.
     * These entry points are matched against the build output files.
     *
     * @returns A `Promise<void>` that resolves when the build and process spawning have completed.
     *
     * @throws Handles any build-related errors using the `handleErrors` method.
     *
     * @remarks
     * - The `config.dev` and `config.watch` settings are temporarily disabled to prevent development mode or file watching during the build.
     * - The `build()` method is called to generate the necessary build outputs.
     * - The `spawnDev` method is then invoked to spawn processes for the matching entry points.
     * - If any errors occur during the build, they are caught and passed to the `handleErrors` method.
     *
     * @example
     * ```typescript
     * const entryPoints = ['index', 'main'];
     * await this.runDebug(entryPoints);
     * ```
     *
     * In this example, the `runDebug` method runs the build process and spawns development processes for `index` and `main`.
     *
     * @public
     */

    async runDebug(entryPoints: Array<string>): Promise<void> {
        return await this.execute(async () => {
            this.config.dev = false;
            this.config.watch = false;
            const result = <BuildResult> await this.build();
            this.spawnDev(<Metafile> result.metafile, entryPoints, true);
        });
    }

    /**
     * Serves the project and watches for changes.
     * This method starts the development server using the `ServerProvider`, builds the project using esbuild,
     * and watches for file changes to automatically rebuild as needed. It initializes the server and invokes
     * the build process, enabling continuous development mode.
     *
     * @returns A promise that resolves when the server is started and the build process is complete.
     *
     * @throws This method catches any errors thrown during the build process and handles them using the
     * `handleErrors` method.
     *
     * @example
     * ```typescript
     * const buildService = new BuildService(config);
     * buildService.serve().then(() => {
     *     console.log('Server is running and watching for changes.');
     * }).catch((error) => {
     *     console.error('Failed to start the server:', error);
     * });
     * ```
     *
     * In this example, the `serve` method starts the server and watches for changes. If an error occurs during
     * the build or server startup, it is handled and logged.
     */

    async serve(): Promise<void> {
        const server = new ServerProvider(this.config.serve, this.config.esbuild.outdir ?? '');

        return await this.execute(async () => {
            server.start();
            const result = await this.build();
            await (<BuildContext> result).watch();
        });
    }

    /**
     * Executes a provided callback function within a try-catch block.
     * This method ensures that any errors thrown during the execution of the callback
     * are properly handled. If the error is related to esbuild's `OnEndResult` and contains
     * an array of errors, it skips additional logging. Otherwise, it logs the error using
     * a custom `VMRuntimeError`.
     *
     * @param callback - A function that returns a `Promise<void>`, which is executed asynchronously.
     *                   This callback is wrapped in error handling logic.
     *
     * @returns A `Promise<void>` which resolves once the callback has been executed.
     *          If an error is thrown, it is caught and handled.
     *
     * @throws In case of an error not related to esbuild, the method catches the error,
     *         wraps it in a `VMRuntimeError`, and logs the error's stack trace to the console.
     *
     * @example
     * ```ts
     * await execute(async () => {
     *   // Perform some asynchronous operation here
     * });
     * ```
     */

    private async execute(callback: () => Promise<void>): Promise<void> {
        try {
            await callback();
        } catch (error: unknown) {
            const esbuildError = <OnEndResult> error;
            if (!Array.isArray(esbuildError.errors)) {
                console.error(new VMRuntimeError(<Error> error).stack);
            }
        }
    }

    /**
     * Configures the development mode by ensuring that `config.dev` is set properly.
     */

    private configureDevelopmentMode(): void {
        if (this.config.dev !== false && (!Array.isArray(this.config.dev) || this.config.dev.length < 1)) {
            this.config.dev = [ 'index' ];
        }
    }

    /**
     * Sets up the plugins provider and registers the plugin hooks.
     */

    private setupPlugins(): void {
        const rootDir = resolve(this.typeScriptProvider.options.baseUrl ?? '');
        const paths = this.generatePathAlias(rootDir);

        this.registerPluginHooks(paths, rootDir);
    }

    /**
     * Registers the plugin hooks for start, end, and load events.
     *
     * @param paths - The resolved path aliases.
     * @param rootDir - The root directory for resolving paths.
     */

    private registerPluginHooks(paths: Record<string, string>, rootDir: string): void {
        this.pluginsProvider.registerOnEnd(this.end.bind(this));
        this.pluginsProvider.registerOnStart(this.start.bind(this));

        this.pluginsProvider.registerOnLoad((content, loader, args) => {
            if (!args.path.endsWith('.ts')) return;

            if (!this.config.esbuild.bundle) {
                const sourceFile = dirname(resolve(args.path).replace(rootDir, '.'));
                content = resolveAliasPlugin(content.toString(), sourceFile, paths, this.config.esbuild.format === 'esm');
            }

            return {
                loader: 'ts',
                contents: parseIfDefConditionals(content.toString(), this.config.define)
            };
        });
    }

    /**
     * Generates a path alias object from the TypeScript provider's path options.
     * This method processes the `paths` property from the TypeScript provider's options,
     * which is expected to be an object where each key represents a path alias pattern,
     * and the corresponding value is an array of paths. The method removes any wildcard
     * characters (`*`) from both the keys and the first values of the arrays. It also
     * resolves the paths relative to the specified `rootDir`, returning a simplified
     * object that maps the cleaned keys to their respective paths.
     *
     * The resolved paths will be formatted to use a relative path notation.
     *
     * Example:
     * Given the following paths:
     * ```typescript
     * {
     *   '@core/*': ['src/core/*'],
     *   '@utils/*': ['src/utils/*']
     * }
     * ```
     * And assuming `rootDir` is set to the base directory of your project, the method
     * will return:
     * ```typescript
     * {
     *   '@core/': './core/',
     *   '@utils/': './utils/'
     * }
     * ```
     *
     * @param {string} rootDir - The root directory to resolve paths against.
     * @returns {Record<string, string>} An object mapping cleaned path aliases to their respective resolved paths.
     */

    private generatePathAlias(rootDir: string): Record<string, string> {
        const paths = this.typeScriptProvider.options.paths;
        const alias: Record<string, string> = {};

        for (const key in paths) {
            const valueArray = paths[key];
            if (valueArray.length > 0) {
                const newKey = key.replace(/\*/g, '');
                alias[newKey] = resolve(valueArray[0].replace(/\*/g, '')).replace(rootDir, '.');
            }
        }

        return alias;
    }

    /**
     * Handles errors during the build process.
     * This method processes and logs errors that occur during the esbuild process. It specifically filters out
     * errors related to TypeScript (`TypesError`) to prevent them from being logged, while logging all other errors
     * to the console. The error object is assumed to contain a list of messages, each with detailed information.
     *
     * @param esbuildError - The error object returned by esbuild, which is expected to contain an array of
     * error messages.
     *
     * @private
     *
     * @remarks
     * - TypeScript errors (denoted as `TypesError`) are skipped and not logged.
     * - Other errors are logged to the console with their text descriptions.
     *
     * @example
     * ```typescript
     * try {
     *     await buildService.run();
     * } catch (esbuildError) {
     *     buildService.handleErrors(esbuildError);
     * }
     * ```
     *
     * In this example, if an error occurs during the build process, the `handleErrors` method is used to
     * process and log the errors.
     */

    private handleErrors(esbuildError: OnEndResult): void {
        const errors = esbuildError.errors ?? [];
        for (const error of errors) {
            if (!error.detail) {
                console.error((new esBuildError(<Message> error)).stack);
                continue;
            }

            // ignore typescript eslint error
            if (error.detail.name === 'TypesError')
                continue;

            if (error.detail.name) {
                if (error.detail.name === 'VMRuntimeError') {
                    console.error(error.detail.stack);
                    continue;
                }

                if (error.detail instanceof Error) {
                    console.error(new VMRuntimeError(error.detail).originalErrorStack);
                    continue;
                }
            }

            return console.error(error.text);
        }
    }

    /**
     * Builds the project based on the configuration.
     * Depending on the configuration, this method either uses esbuild's `context` for watching or `build` for a one-time build.
     *
     * @returns A promise that resolves with the build context or result.
     *
     * @private
     */

    private async build(): Promise<BuildContext | SameShape<unknown, unknown> | BuildResult> {
        packageTypeComponent(this.config);
        const esbuild = this.config.esbuild;

        if (this.config.hooks) {
            this.pluginsProvider.registerOnEnd(this.config.hooks.onEnd);
            this.pluginsProvider.registerOnLoad(this.config.hooks.onLoad);
            this.pluginsProvider.registerOnStart(this.config.hooks.onStart);
            this.pluginsProvider.registerOnResolve(this.config.hooks.onResolve);
        }

        if (!esbuild.define) {
            esbuild.define = {};
        }

        for (const key in this.config.define) {
            esbuild.define[key] = JSON.stringify(this.config.define[key]);
        }

        if (!this.config.esbuild.bundle) {
            await this.processEntryPoints();
        }

        esbuild.plugins = [ this.pluginsProvider.setup() ];
        if (this.config.watch || this.config.dev || this.config.serve.active) {
            return await context(esbuild);
        }

        return await build(esbuild);
    }

    /**
     * Manages development processes for specified entry points.*
     * This method spawns development processes for each file in the metafile that matches any of the specified entry points.
     * It enables features like source maps and optional debugging mode for each spawned process.
     *
     * @param meta - The metafile containing information about build outputs.
     * This typically includes a mapping of output files and their dependencies.
     * @param entryPoint - An array of entry point file names to match against the metafile outputs.
     * Only files that match these entry points will have development processes spawned.
     * @param debug - A boolean flag to enable debugging mode for spawned processes.
     * If `true`, the processes will start in debug mode with the `--inspect-brk` option. Defaults to `false`.
     *
     * @returns void
     *
     * @remarks
     * - Files that contain 'map' in their names (e.g., source map files) are ignored and no process is spawned for them.
     * - For each matching file in the metafile outputs, a new development process is spawned using the `spawn` function.
     * - The `activePossess` array tracks all spawned processes, allowing further management (e.g., termination).
     *
     * @example
     * ```typescript
     * const meta = {
     *   outputs: {
     *     'dist/index.js': { \/* ... *\/ },
     *     'dist/index.js.map': { \/* ... *\/ }
     *   }
     * };
     * const entryPoints = ['index'];
     *
     * this.spawnDev(meta, entryPoints, true); // Spawns processes in debug mode
     * ```
     *
     * @private
     */

    private spawnDev(meta: Metafile, entryPoint: Array<string>, debug: boolean = false) {
        if (!Array.isArray(entryPoint))
            return;

        for (const file in meta.outputs) {
            if (file.includes('map') || !entryPoint.some(key => file.includes(`/${ key }.`)))
                continue;

            this.activePossess.push(spawn(file, debug));
        }
    }

    /**
     * Starts the build process and type checking.
     * This method performs initial setup for the build and ensures that any child processes are terminated properly.
     *
     * @private
     */

    private async start(build: PluginBuild) {
        try {
            console.log(`${ prefix() } StartBuild ${ build.initialOptions.outdir }`);
            if (!this.config.noTypeChecker)
                this.typeScriptProvider.typeCheck(this.config.buildOnError);

            if (this.config.declaration)
                this.typeScriptProvider.generateDeclarations(this.config.esbuild.entryPoints);
        } finally {
            while (this.activePossess.length > 0) {
                const element = this.activePossess.pop();
                if (element)
                    element.kill('SIGTERM');
            }
        }
    }

    /**
     * Finalizes the build process and logs results.
     * This method handles the end of the build process, logs build results, and processes development files if applicable.
     *
     * @param result - The result object from the build process.
     *
     * @private
     */

    private async end(result: BuildResult) {
        if (result.errors.length > 0) {
            return this.handleErrors(result);
        }

        console.log(
            `\n${ prefix() } ${ setColor(Colors.DeepOrange, 'Build completed!') }`
        );
        console.log(`${ prefix() } ${ Object.keys(result.metafile!.outputs).length } Modules:`);
        Object.keys(result.metafile!.outputs).forEach((output) => {
            const size = result.metafile!.outputs[output].bytes;
            console.log(
                `${ prefix() } ${ setColor(Colors.CanaryYellow, output) }: ${ setColor(Colors.BurntOrange, size.toString()) } bytes`
            );
        });

        console.log('\n');
        if (this.config.dev) {
            this.spawnDev(<Metafile> result.metafile, <Array<string>> this.config.dev);
        }
    }

    /**
     * Processes and updates entry points based on project dependencies.
     * This method analyzes the project's dependencies and adjusts entry points configuration as needed.
     *
     * @private
     */

    private async processEntryPoints(): Promise<void> {
        const esbuild = this.config.esbuild;
        const meta = await analyzeDependencies(esbuild.entryPoints, esbuild.platform);
        const rootDir = resolve(this.typeScriptProvider.options.baseUrl ?? '');

        // it pointer and change the esbuild.entryPoints if is object value from configuration !!
        let entryPoints = extractEntryPoints(esbuild.entryPoints);
        let entryPointsList = Object.values(entryPoints);

        if (Array.isArray(esbuild.entryPoints) && typeof esbuild.entryPoints[0] === 'string') {
            entryPoints = {};
            entryPointsList = [];
        }

        for (const file in meta.inputs) {
            if (entryPointsList.includes(file))
                continue;

            const resolveFile = resolve(file).replace(rootDir, '.');
            const fileName = resolveFile.substring(0, resolveFile.lastIndexOf('.'));
            entryPoints[fileName] = file;
        }

        esbuild.entryPoints = entryPoints;
    }
}
