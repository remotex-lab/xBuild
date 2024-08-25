/**
 * Import will remove at compile time
 */

import type { Diagnostic, ParsedCommandLine, Program } from 'typescript';

/**
 * Imports
 */

import { cwd } from 'process';
import { join, dirname, relative, resolve } from 'path';
import { readdir, readFileSync, writeFileSync } from 'fs';
import { createProgram, getPreEmitDiagnostics, flattenDiagnosticMessageText } from 'typescript';

/**
 * Manages TypeScript compilation, type checking, and declaration file generation.
 *
 * The `TypescriptDirective` class is responsible for setting up TypeScript programs, running
 * type checks or emitting declaration files, and handling path aliases based on TypeScript
 * configuration.
 */

export class TypescriptDirective {
    /**
     * Alias object
     */

    private aliases: { [key: string]: string } = {};

    /**
     * Initializes the TypescriptDirective class with TypeScript configuration and output directory.
     *
     * @param tsConfig - The parsed TypeScript configuration.
     * @param outDir - The output directory for compiled files or declaration files.
     */

    constructor(public tsConfig: ParsedCommandLine, private outDir: string) {
        this.generatePathAliases();
    }

    get alias() {
        return this.aliases;
    }

    /**
     * Runs the TypeScript type checker and optionally generates declaration files (.d.ts).
     *
     * Logs any diagnostic errors and throws an error if issues are detected during type checking
     * or declaration file generation. Optionally resolves path aliases in emitted declaration files.
     *
     * @param emitDeclaration - Flag indicating if declaration files should be generated.
     * @throws Error If there are diagnostic errors.
     */

    runTypeCheckerOrEmitDeclaration(emitDeclaration: boolean): void {
        const program = this.createProgram(emitDeclaration);
        const diagnostics = this.getDiagnostics(program, emitDeclaration);

        if (diagnostics.length > 0) {
            this.handleDiagnostics(diagnostics, emitDeclaration);
        }

        if(emitDeclaration) {
            this.resolvePathAlias();
        }
    }

    /**
     * Creates a TypeScript program with the given configuration.
     *
     * Configures the TypeScript compiler options to either emit declaration files or
     * perform type checking without emitting output files.
     *
     * @param emitDeclaration - Flag to indicate if declaration files should be emitted.
     * @returns A TypeScript Program object.
     */

    private createProgram(emitDeclaration: boolean): Program {
        return createProgram(this.tsConfig.fileNames, {
            ...this.tsConfig.options,
            noEmit: !emitDeclaration,
            outDir: emitDeclaration ? this.outDir : undefined,
            baseUrl: cwd(),
            declaration: emitDeclaration,
            skipLibCheck: true,
            emitDeclarationOnly: emitDeclaration
        });
    }

    /**
     * Retrieves diagnostics from the TypeScript program, including pre-emit diagnostics and, if applicable,
     * diagnostics from the emit process.
     *
     * @param program - The TypeScript program to run diagnostics on.
     * @param emitDeclaration - Flag indicating if declaration files were emitted.
     * @returns An array of TypeScript diagnostics (errors or warnings).
     */

    private getDiagnostics(program: Program, emitDeclaration: boolean): Array<Diagnostic> {
        const emitResult = emitDeclaration ? program.emit() : undefined;

        return getPreEmitDiagnostics(program).concat(emitDeclaration && emitResult ? emitResult.diagnostics : []);
    }

    /**
     * Handles and logs TypeScript diagnostics.
     *
     * If any diagnostics are present, logs them to the console, and throws an error indicating
     * whether the process failed due to type checking or declaration generation issues.
     *
     * @param diagnostics - The array of diagnostics (errors or warnings).
     * @param emitDeclaration - Flag to indicate if declaration files were emitted.
     * @throws Error If there are any diagnostic errors.
     */

    private handleDiagnostics(diagnostics: Array<Diagnostic>, emitDeclaration: boolean) {
        diagnostics.forEach((diagnostic) => {
            if (diagnostic.file) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
                const message = flattenDiagnosticMessageText(diagnostic.messageText, '\n');
                console.error(`${ diagnostic.file.fileName } (${ line + 1 },${ character + 1 }): ${ message }`);
            } else {
                console.error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            }
        });

        const errorMessage = emitDeclaration
            ? 'Declaration generation failed due to errors.'
            : 'Type checking failed due to errors.';
        throw new Error(errorMessage);
    }

    /**
     * Recursively traverses a directory and processes all files with a specified callback function.
     *
     * This method reads the contents of the specified directory, and for each file found, it executes
     * the provided `fileCallback` function. If a subdirectory is encountered, it recursively traverses
     * into that subdirectory. The callback function is only executed for files, not directories.
     *
     * @param dir - The directory path to traverse.
     * @param fileCallback - A callback function that is called with the path of each file found.
     *   The callback receives a single argument, which is the full path of the file.
     *
     * @throws Error If there is an issue reading the directory.
     *
     * @example
     * // Example usage of traverseDirectory
     * const processFile = (filePath: string) => {
     *     console.log(`Processing file: ${filePath}`);
     * };
     * traverseDirectory('some-directory', processFile);
     */

    private traverseDirectory(dir: string, fileCallback: (filePath: string) => void): void {
        readdir(dir, { withFileTypes: true }, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err);

                return;
            }

            files.forEach(file => {
                const filePath = join(dir, file.name);
                if (file.isDirectory()) {
                    this.traverseDirectory(filePath, fileCallback);
                } else if (file.isFile() && file.name.endsWith('.d.ts')) {
                    fileCallback(filePath);
                }
            });
        });
    }

    /**
     * Resolves and replaces path aliases in emitted declaration files with actual paths.
     *
     * Traverses the output directory, reads each file, replaces path aliases with their resolved paths,
     * and writes the modified content back to the file.
     */

    private resolvePathAlias(): void {
        this.traverseDirectory(this.outDir, (f) => {
            const fileDir = join(cwd(), dirname(f));
            let content = readFileSync(f).toString();

            for (const alias in this.aliases) {
                const relativePath = relative(fileDir, this.aliases[alias]).replace(/\\/g, '/');
                const path = relativePath.startsWith('..') ? relativePath : `./${ relativePath }`;
                content = content.replaceAll(alias, path);
            }

            writeFileSync(f, content);
        });
    }

    /**
     * Generates path aliases based on TypeScript configuration and output directory.
     *
     * Computes path aliases from the TypeScript `paths` configuration, resolves their target paths,
     * and adjusts them relative to the output directory.
     */

    private generatePathAliases(): void {
        const outDir = relative(cwd(), this.outDir);
        const paths = this.tsConfig.options.paths;
        const baseUrl = relative(cwd(), this.tsConfig.options.baseUrl ?? '.');
        const rootDir = relative(cwd(), this.tsConfig.options.rootDir ?? '.');

        for (const pattern in paths) {
            const key = pattern.replace('/*', '');
            const valuePattern = paths[pattern][0].replace('/*', '');
            const targetPath = join(baseUrl, valuePattern);
            this.aliases[key] = './' + targetPath.replace(rootDir, outDir).replace(/\\/g, '/');
        }
    }
}
