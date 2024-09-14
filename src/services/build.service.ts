/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams } from 'child_process';
import type { BuildContext, BuildResult, Message, Metafile, Plugin, SameShape } from 'esbuild';
import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { resolve } from 'path';
import { build, context } from 'esbuild';
import { spawn } from '@services/process.service';
import { prefix } from '@components/banner.component';
import { Colors, setColor } from '@components/colors.component';
import { analyzeDependencies } from '@services/transpiler.service';
import { TypeScriptProvider } from '@providers/typescript.provider';
import { tsConfiguration } from '@providers/configuration.provider';
import { extractEntryPoints } from '@components/entry-points.component';
import { ServerProvider } from '@providers/server.provider';

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

    private typeScriptProvider: TypeScriptProvider;

    /**
     * Keeps track of active development processes spawned during the build.
     *
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
     * Initializes the build service with the provided configuration.
     *
     * The constructor sets up the TypeScript provider, suppresses esbuild logging, and configures development modes.
     *
     * @param config - The configuration object for the build process, including esbuild and TypeScript settings.
     */

    constructor(private config: ConfigurationInterface) {
        this.config.esbuild.logLevel = 'silent';
        this.typeScriptProvider = new TypeScriptProvider(
            tsConfiguration(this.config.esbuild.tsconfig ?? ''), this.config.esbuild.outdir ?? ''
        );

        if (this.config.dev !== false && (!Array.isArray(this.config.dev) || this.config.dev.length < 1))
            this.config.dev = [ 'index' ];
    }

    async serve() {
        const server = new ServerProvider(this.config.serve, this.config.esbuild.outdir ?? '');

        try {
            server.start();
            const result = await this.build();
            await (<BuildContext> result).watch();

        } catch (esbuildError: unknown) {
            const errors = (<{ [keys: string]: Array<Message> }> esbuildError).errors;

            for (const error of errors) {
                if (error.detail.name === 'TypesError')
                    continue;

                console.error(error.text);
            }
        }
    }

    /**
     * Executes the build process.
     *
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
        try {
            const result = await this.build();
            if (this.config.watch || this.config.dev) {
                await (<BuildContext> result).watch();
            }
        } catch (esbuildError: unknown) {
            const errors = (<{ [keys: string]: Array<Message> }> esbuildError).errors;

            for (const error of errors) {
                if (error.detail.name === 'TypesError')
                    continue;

                console.error(error.text);
            }
        }
    }

    /**
     * Builds the project based on the configuration.
     *
     * Depending on the configuration, this method either uses esbuild's `context` for watching or `build` for a one-time build.
     *
     * @returns A promise that resolves with the build context or result.
     *
     * @private
     */

    private async build(): Promise<BuildContext | SameShape<unknown, unknown>> {
        const esbuild = this.config.esbuild;
        if (!this.config.esbuild.bundle) {
            await this.processEntryPoints();
        }
        esbuild.plugins = [ this.rebuildPlugin() ];
        if (this.config.watch || this.config.dev || this.config.serve.active) {
            return await context(esbuild);
        }

        return await build(esbuild);
    }

    /**
     * Manages development processes for specified files.
     *
     * This method spawns development processes for files listed in the metafile, enabling development mode features.
     *
     * @param meta - The metafile containing information about build outputs.
     *
     * @private
     */

    private spawnDev(meta: Metafile) {
        if (!Array.isArray(this.config.dev))
            return;

        for (const file in meta.outputs) {
            if (file.includes('map') || !this.config.dev.some(key => file.includes(key)))
                continue;

            this.activePossess.push(spawn(file));
        }
    }

    /**
     * Starts the build process and type checking.
     *
     * This method performs initial setup for the build and ensures that any child processes are terminated properly.
     *
     * @private
     */

    private async start() {
        try {
            console.log(`${ prefix() } StartBuild`);
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
     *
     * This method handles the end of the build process, logs build results, and processes development files if applicable.
     *
     * @param result - The result object from the build process.
     *
     * @private
     */

    private async end(result: BuildResult) {
        if (result.errors.length > 0) {
            return;
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
            this.spawnDev(<Metafile> result.metafile);
        }
    }

    /**
     * Creates a plugin for esbuild to handle build notifications.
     *
     * The plugin sets up hooks to notify when the build starts and ends, including handling of build results.
     *
     * @returns A configured esbuild plugin.
     *
     * @private
     */

    private rebuildPlugin(): Plugin {
        const end = this.end.bind(this);
        const start = this.start.bind(this);

        return {
            name: 'rebuild-notify',
            setup(build) {
                build.initialOptions.metafile = true;
                build.onStart(async () => {
                    await start();
                });

                build.onEnd(async (result: BuildResult) => {
                    await end(result);
                });
            }
        };
    }

    /**
     * Processes and updates entry points based on project dependencies.
     *
     * This method analyzes the project's dependencies and adjusts entry points configuration as needed.
     *
     * @private
     */

    private async processEntryPoints(): Promise<void> {
        const esbuild = this.config.esbuild;
        const meta = await analyzeDependencies(esbuild.entryPoints, esbuild.platform);
        const rootDir = resolve(this.typeScriptProvider.options.rootDir ?? '');

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

            const resolveFile = resolve(file).replace(rootDir + '\\', '');
            const fileName = resolveFile.substring(0, resolveFile.lastIndexOf('.'));
            entryPoints[fileName] = file;
        }

        esbuild.entryPoints = entryPoints;
    }
}
