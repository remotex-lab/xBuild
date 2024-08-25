/**
 * Import will remove at compile time
 */

import type { ParsedCommandLine } from 'typescript';
import type { BuildContext, SameShape } from 'esbuild';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import type { ConfigurationInterface } from '@providers/interfaces/configuration.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build, context } from 'esbuild';
import { extname, join, normalize, sep } from 'path';
import { contentPlugin } from '@plugins/content.plugin';
import { rebuildPlugin } from '@plugins/rebuild.plugin';
import { analyzeDependencies } from '@services/transpiler.service';
import { TypescriptDirective } from '@directives/typescript.directive';
import { getTsConfiguration } from '@components/configuration.component';
import { spawn } from '@providers/process.provider';
import { tmpdir } from 'os';
import * as http from 'node:http';

/**
 * Manages the build process for a TypeScript project using esbuild.
 *
 * The `BuildDirective` class provides methods to handle different build scenarios,
 * such as development, serving, and general builds. It integrates with the `TypescriptDirective`
 * class for type checking and declaration file generation.
 */

export class BuildDirective {
    /**
     * Manages TypeScript compilation, type checking, and declaration file generation.
     */

    private typescriptDirective: TypescriptDirective;

    /**
     * Creates an instance of BuildDirective.
     *
     * Initializes the `TypescriptDirective` instance using the TypeScript configuration
     * and output directory specified in the provided configuration.
     *
     * @param config - The build configuration.
     */

    constructor(private config: ConfigurationInterface) {
        this.typescriptDirective = new TypescriptDirective(this.tsConfig, <string> this.config.esbuild.outdir);
        // console.log(this.typescriptDirective.alias);
        this.setDefaultPlugin();
    }

    /**
     * Gets the parsed TypeScript configuration from the specified file.
     *
     * @returns The parsed TypeScript configuration.
     */

    get tsConfig(): ParsedCommandLine {
        return getTsConfiguration(join(cwd(), this.config.esbuild.tsconfig ?? 'tsconfig.json'));
    }

    /**
     * Runs the development build process.
     *
     * Configures esbuild for bundling without writing output files, runs type checking or
     * declaration generation if required, and starts the watch mode for live development.
     *
     * @throws Error If there is an issue during the build process.
     */

    async dev(): Promise<void> {
        console.log('xxx');
        this.config.esbuild.write = true;
        this.config.esbuild.bundle = true;
        this.config.esbuild.minify = true;
        this.config.esbuild.outdir = join(tmpdir(), 'xBuilds');

        if (!this.config.noTypeChecker || this.config.declaration)
            this.typescriptDirective.runTypeCheckerOrEmitDeclaration(this.config.declaration);

        try {
            const result = await this.build();
            await (<BuildContext> result).watch();
        } catch (error: any) {
            console.error(error.message);
        }
    }

    /**
     * Runs the serve build process.
     *
     * Configures esbuild for bundling without writing output files, and runs type checking or
     * declaration generation if required.
     *
     * @throws Error If there is an issue during the build process.
     */

    async serve(): Promise<void> {
        try {
            if (!this.config.noTypeChecker || this.config.declaration)
                this.typescriptDirective.runTypeCheckerOrEmitDeclaration(this.config.declaration);

            const result = await this.build();
            const serveConfig: any = { ...this.config.serve, port: (this.config.serve.port ?? 3000) - 1 };
            delete serveConfig.active;

            await (<BuildContext> result).serve(serveConfig);
        } catch (error: any) {
            console.error(error.message);
        }
    }

    /**
     * Runs the build process based on the configuration.
     *
     * Executes type checking or declaration generation if required and performs the build
     * using esbuild. If watch mode is enabled, it starts watching for file changes.
     *
     * @throws Error If there is an issue during the build process.
     */

    async run(): Promise<void> {
        console.log('xxx2');
        if (!this.config.noTypeChecker || this.config.declaration)
            this.typescriptDirective.runTypeCheckerOrEmitDeclaration(this.config.declaration);

        try {
            const result = await this.build();

            if (this.config.watch) {
                await (<BuildContext> result).watch();
            }
        } catch (error: any) {
            console.error(error.message);
        }
    }

    /**
     * Builds the project using esbuild based on the current configuration.
     *
     * Adjusts entry points if necessary, and returns a build context if watch mode is enabled,
     * or performs a one-time build.
     *
     * @returns A promise that resolves to the build context or result of the build operation.
     */

    private async build(): Promise<BuildContext | SameShape<unknown, unknown>> {
        const config = this.config.esbuild;

        if (!this.config.esbuild.bundle) {
            const entryFile: Array<string> = Array.isArray(this.config.esbuild.entryPoints)
                ? <Array<string>> config.entryPoints
                : Object.values(config.entryPoints as { [key: string]: string });

            const meta = await analyzeDependencies(entryFile[0], this.config.esbuild.platform);
            const entryPoints = Object.values<string>(<Array<string>> this.config.esbuild.entryPoints);

            for (const file in meta.inputs) {
                if (!entryPoints.includes(file)) {
                    const key = this.getFilenameWithoutExtension(file);
                    (<{ [key: string]: string }> config.entryPoints)[key] = file;
                }
            }
        }

        if (this.config.watch || this.config.dev || this.config.serve.active) {
            return await context(config);
        }

        return await build(config);
    }

    /**
     * Gets the filename without its extension from a file path.
     *
     * Normalizes the file path, removes the directory part, and strips the file extension.
     *
     * @param filePath - The full path to the file.
     * @returns The filename without its extension.
     */

    private getFilenameWithoutExtension(filePath: string): string {
        const parts = normalize(filePath).split(sep);
        const filePart = parts.slice(1).join(sep);

        return filePart.slice(0, -extname(filePart).length);
    }

    private setDefaultPlugin(): void {
        this.config.esbuild.plugins = this.config.esbuild.plugins ?? [];
        const plugins = this.config.esbuild.plugins;
        let process: null | ChildProcessWithoutNullStreams = null;


        plugins.unshift(rebuildPlugin(async () => {
            if (!this.config.noTypeChecker || this.config.declaration)
                this.typescriptDirective.runTypeCheckerOrEmitDeclaration(this.config.declaration);
        }, async (result, build) => {
            console.log(`build ended with ${ result.errors.length } errors`);

            if (!this.config.dev) {
                return;
            }

            const file = join(<string> build.initialOptions.outdir, Object.keys(<any> build.initialOptions.entryPoints)[0] + '.js');
            if (process) {
                process.kill('SIGTERM');
            }
            process = spawn(file);
            console.log(process.pid);
        }));

        plugins.unshift(
            contentPlugin(
                this.typescriptDirective, <string> this.config.esbuild.outdir, this.config.esbuild.format === 'esm'
            )
        );
    }
}
