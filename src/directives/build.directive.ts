/**
 * Import will remove at compile time
 */

import { build, type BuildContext, context, type SameShape } from 'esbuild';
import type { ConfigurationInterface } from '@components/interfaces/configuration.interface';

/**
 * Imports
 */
import { extname, join, normalize, sep } from 'path';
import { defPlugin } from '@plugins/ifdef.plugin';
import { analyzeDependencies } from '@core/services/transpiler.service';
import { createProgram, flattenDiagnosticMessageText, getPreEmitDiagnostics } from 'typescript';
import { readTsConfig } from '@components/configuration.component';
import { cwd } from 'process';

function getFilenameWithoutExtension(filePath: string): string {
    // Normalize and split the path into segments
    const parts = normalize(filePath).split(sep);

    // Remove the first directory part
    const filePart = parts.slice(1).join(sep);

    // Remove the extension from the base name
    return filePart.slice(0, -extname(filePart).length);
}

export class BuildDirective {
    constructor(private config: ConfigurationInterface) {
    }

    async dev(): Promise<void> {
        try {
            this.typescriptChecker();
            const result = await this.build();

            await (<BuildContext> result).watch();
        } catch (error: any) {
            console.error(error.message);
        }
    }

    async serve(): Promise<void> {
        try {
            this.typescriptChecker();
        } catch (error: any) {
            console.error(error.message);
        }
    }

    async run(): Promise<void> {
        try {
            this.typescriptChecker();
            const result = await this.build();

            if (this.config.watch) {
                await (<BuildContext> result).watch();
            }
        } catch (error: any) {
            console.error(error.message);
        }
    }

    private typescriptChecker() {
        try {
            if (!this.config.noTypeChecker) {
                this.runTypeChecker();
            }

            if (this.config.declaration) {
                this.generateDeclaration();
            }

        } catch (e) {
            if (!this.config.buildOnError) {
                throw e;
            }
        }
    }

    private async build(): Promise<BuildContext | SameShape<unknown, unknown>> {
        const config = this.config.esbuild;

        if (this.config.defines) {
            config.define = config.define ?? {};
            for (const key in this.config.defines) {
                if (this.config.defines.hasOwnProperty(key)) {
                    config.define[key] = JSON.stringify(this.config.defines[key]);
                }
            }
        }

        if (config.define && Object.keys(config.define).length > 0) {
            config.plugins = config.plugins ?? [];
            config.plugins.unshift(defPlugin({ defines: config.define }));
        }

        if (this.config.watch || this.config.dev || this.config.serve.active) {
            return await context(config);
        }

        if (!this.config.esbuild.bundle) {
            const entryFile: Array<string> = Array.isArray(this.config.esbuild.entryPoints)
                ? <Array<string>> config.entryPoints
                : Object.values(config.entryPoints as { [key: string]: string });

            const x = await analyzeDependencies(entryFile[0], this.config.esbuild.platform);
            const dd = Object.values<string>(<Array<string>>this.config.esbuild.entryPoints);

            for (const item of Object.keys(x.inputs)) {
                if (!dd.includes(item)) {
                    (<any>config.entryPoints)[getFilenameWithoutExtension(item)] = item;
                }
            }
        }

        return await build(config);
    }

    /**
     * Generates TypeScript declaration file (.d.ts) for the given entry file.
     */

    private generateDeclaration() {
        const tsconfig = readTsConfig(join(cwd(), this.config.esbuild.tsconfig ?? 'tsconfig'));
        const program = createProgram(tsconfig.fileNames, {
            ...tsconfig.options,
            declaration: true,
            skipLibCheck: true,
            emitDeclarationOnly: true,
            outDir: this.config.esbuild.outdir,
            baseUrl: cwd()
        });

        const emitResult = program.emit();
        const diagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        if (diagnostics.length > 0) {
            diagnostics.forEach((diagnostic) => {
                if (diagnostic.file) {
                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                        <number> diagnostic.start
                    );

                    const message = flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    console.error(`${ diagnostic.file.fileName } (${ line + 1 },${ character + 1 }): ${ message }`);
                } else {
                    console.error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
                }
            });

            throw new Error('Declaration generation failed due to errors.');
        }
    }

    /**
     * Runs the TypeScript type checker on the given entry file.
     */

    private runTypeChecker() {
        const tsconfig = <any>readTsConfig(join(cwd(), this.config.esbuild.tsconfig ?? 'tsconfig.json'));
        const program = createProgram(tsconfig.fileNames, {
            ...tsconfig.options,
            noEmit: true, // No need to emit files, just check types
            skipLibCheck: true, // Skip type checking of declaration files in node_modules
        });

        const diagnostics = getPreEmitDiagnostics(program);
        if (diagnostics.length > 0) {
            diagnostics.forEach((diagnostic) => {
                if (diagnostic.file) {
                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                        <number> diagnostic.start
                    );
                    const message = flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                    console.error(`${ diagnostic.file.fileName } (${ line + 1 },${ character + 1 }): ${ message }`);
                } else {
                    console.error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
                }
            });

            throw new Error('Type checking failed due to errors.');
        }
    }

}
