/**
 * Import will remove at compile time
 */

import type { EntryPoints } from '@configuration/interfaces/configuration.interface';
import type {
    Node,
    Bundle,
    Diagnostic,
    SourceFile,
    StringLiteral,
    CompilerOptions,
    CustomTransformer,
    ImportDeclaration,
    ExportDeclaration,
    ParsedCommandLine,
    TransformationContext,
    CustomTransformerFactory
} from 'typescript';

/**
 * Imports
 */

import { TypesError } from '@errors/types.error';
import { prefix } from '@components/banner.component';
import { resolve, relative, dirname, parse } from 'path';
import { Colors, setColor } from '@components/colors.component';
import { extractEntryPoints } from '@components/entry-points.component';
import {
    sys,
    factory,
    createProgram,
    visitEachChild,
    isStringLiteral,
    resolveModuleName,
    isImportDeclaration,
    isExportDeclaration,
    getPreEmitDiagnostics,
    flattenDiagnosticMessageText
} from 'typescript';

/**
 * Provides TypeScript-related utilities such as type-checking, generating declaration files,
 * and transforming module specifiers into relative paths based on the output directory.
 *
 * The `TypescriptProvider` class enables users to type-check TypeScript projects, generate
 * declaration files, and transform import/export paths into relative paths that match the output directory.
 * It uses the TypeScript Compiler API to achieve these transformations.
 *
 * @class
 * @example
 * ```typescript
 * const tsProvider = new TypescriptProvider(parsedConfig, './dist');
 * tsProvider.typeCheck(entryPoints);
 * tsProvider.generateDeclarations(entryPoints);
 * ```
 */

export class TypeScriptProvider {

    /**
     * Compiler options for configuring TypeScript compilation.
     */

    readonly options: CompilerOptions;

    /**
     * Creates an instance of `TypescriptProvider` with the given TypeScript configuration and output directory.
     *
     * This constructor initializes a `TypescriptProvider` with the provided TypeScript configuration
     * and the directory where output files (such as declaration files) will be stored.
     * Additionally, it accepts a flag to control whether ANSI color formatting should be applied in output messages.
     *
     * @param tsConfig - The parsed TypeScript configuration object.
     * @param outDir - The directory where output files (such as declaration files) will be stored.
     * @param activeColor - A boolean flag indicating whether ANSI color formatting should be applied in output messages.
     * Default is `true`.
     *
     * @example
     * ```typescript
     * const tsProvider = new TypescriptProvider(parsedConfig, './dist');
     * ```
     *
     * @example
     * ```typescript
     * const tsProvider = new TypescriptProvider(parsedConfig, './dist', false);
     * // This instance will not apply ANSI color formatting in output messages
     * ```
     */

    constructor(public tsConfig: ParsedCommandLine, private outDir: string, private activeColor: boolean = true) {
        this.options = {
            ...this.tsConfig.options,
            outDir: this.outDir
        };
    }

    /**
     * Performs type-checking on the specified entry points without emitting any files.
     *
     * This method compiles the provided TypeScript files to check for type errors and other diagnostics without
     * generating any output files. It ensures that the code adheres to TypeScript's type constraints and reports
     * any issues found during the type-checking process.
     *
     * @param allowError - A boolean flag indicating whether to throw an error if diagnostics are present. If set to
     * `true`, errors are logged but not thrown, allowing the process to continue. Defaults to `false`, which throws
     * an error if diagnostics are encountered.
     *
     * @returns void
     *
     * @throws Throws an error if type-checking fails due to TypeScript diagnostics and `allowError` is `false`.
     * The error indicates that the type-checking process has encountered issues.
     *
     * @example
     * ```typescript
     * // Type-check files and handle any diagnostics
     * tsProvider.typeCheck(['src/index.ts', 'src/app.ts']);
     * ```
     */

    typeCheck(allowError: boolean = false): void {
        const program = createProgram(this.tsConfig.fileNames, {
            ...this.options,
            noEmit: true,
            skipLibCheck: true
        });

        this.handleDiagnostics(getPreEmitDiagnostics(program), allowError);
    }

    /**
     * Generates TypeScript declaration files (`.d.ts`) for the specified entry points.
     *
     * This method compiles the provided TypeScript files and emits only the declaration files, without generating
     * JavaScript code. It applies a custom transformer to modify module specifiers to relative paths based on the
     * output directory. This ensures that the generated declaration files are accurate and the module paths are
     * aligned with the project's build structure.
     *
     * @param entryPoints - An array of entry points or an object representing the entry files for which declarations
     * are generated. Entry points can be provided in the following formats:
     *   - An array of strings representing file paths (`string[]`).
     *   - An array of objects with `in` and `out` properties (`{ in: string, out: string }[]`).
     *   - A record object with file paths as values (`Record<string, string>`).
     *
     * @returns void
     *
     * @example
     * ```typescript
     * // Generate declaration files for specific entry points
     * tsProvider.generateDeclarations(['src/index.ts', 'src/app.ts']);
     * ```
     */

    generateDeclarations(entryPoints: EntryPoints): void {
        const files = Object.values(extractEntryPoints(entryPoints));
        const program = createProgram(files, {
            ...this.options,
            declaration: true,
            skipLibCheck: true,
            emitDeclarationOnly: true
        });

        program.emit(undefined, undefined, undefined, true, {
            afterDeclarations: [ this.createTransformerFactory() ]
        });
    }

    /**
     * Checks if the provided node is an import or export declaration.
     *
     * @param node - A TypeScript AST node to check.
     *
     * @returns `true` if the node is either an `ImportDeclaration` or `ExportDeclaration`; otherwise, `false`.
     *
     * @example
     * ```typescript
     * const isDeclaration = tsProvider.isImportOrExportDeclaration(node);
     * console.log(isDeclaration); // true or false
     * ```
     */

    private isImportOrExportDeclaration(node: Node): boolean {
        return isImportDeclaration(node) || isExportDeclaration(node);
    }

    /**
     * Checks if the provided node has a string literal as its module specifier.
     *
     * @param node - A TypeScript AST node to check.
     *
     * @returns `true` if the node has a string literal module specifier; otherwise, `undefined`.
     *
     * @example
     * ```typescript
     * const hasModuleSpecifier = tsProvider.hasStringLiteralModuleSpecifier(importNode);
     * console.log(hasModuleSpecifier); // true or undefined
     * ```
     */

    private hasStringLiteralModuleSpecifier(node: Node): boolean | undefined {
        return (<ImportDeclaration> node).moduleSpecifier && isStringLiteral((<ImportDeclaration> node).moduleSpecifier);
    }

    /**
     * Resolves the module file name based on the module specifier and TypeScript compiler options.
     *
     * @param specifierText - The module specifier text (e.g., `'./module'`).
     * @param options - The TypeScript compiler options.
     *
     * @returns The resolved file path of the module or `undefined` if the module cannot be resolved.
     *
     * @example
     * ```typescript
     * const resolvedPath = tsProvider.resolveModuleFileName('./module', compilerOptions);
     * console.log(resolvedPath); // './dist/module.js'
     * ```
     */

    private resolveModuleFileName(specifierText: string, options: CompilerOptions): string | undefined {
        let path = undefined;
        const resolvedModule = resolveModuleName(specifierText, options.baseUrl!, options, sys);

        if (resolvedModule.resolvedModule && options.rootDir) {
            if (resolvedModule.resolvedModule.resolvedFileName.includes('node_modules'))
                return path;

            path = resolve(resolvedModule.resolvedModule.resolvedFileName).replace(
                resolve(options.rootDir), '.'
            );
        }

        return path;
    }

    /**
     * Computes the relative path from the source file to the resolved target file.
     *
     * @param sourceFile - The absolute path of the source file.
     * @param resolvedTargetFile - The absolute path of the resolved target file.
     *
     * @returns A relative path from the source file to the target file.
     *
     * @example
     * ```typescript
     * const relativePath = tsProvider.getRelativePathToOutDir('./src/index.ts', './dist/module.js');
     * console.log(relativePath); // './module.js'
     * ```
     */

    private getRelativePathToOutDir(sourceFile: string, resolvedTargetFile: string): string {
        sourceFile = resolve(sourceFile).replace(resolve(this.options.rootDir ?? ''), '.');
        const relativePath = relative(dirname(sourceFile), resolvedTargetFile).replace(/\\/g, '/');
        const parsePath = parse(relativePath);

        if (!parsePath.dir.startsWith('..')) {
            parsePath.dir = `./${ parsePath.dir }`;
        }

        return `${ parsePath.dir }/${ parsePath.name }`;
    }

    /**
     * Updates the module specifier of an import or export declaration to a relative path based on the output directory.
     *
     * This method takes a TypeScript `ImportDeclaration` or `ExportDeclaration` node and updates its module
     * specifier to a relative path that matches the output directory. It uses the TypeScript compiler options
     * to resolve the full path of the module and converts it into a relative path from the source file.
     *
     * This is useful when transforming module specifiers to ensure the generated declaration files (`.d.ts`)
     * have correct paths when files are moved to the output directory.
     *
     * @param node - The TypeScript `ImportDeclaration` or `ExportDeclaration` node whose module specifier needs to be updated.
     * @param sourceFile - The absolute path of the source file containing the node.
     *
     * @returns The updated `ImportDeclaration` or `ExportDeclaration` node with the new relative module specifier.
     *
     * @example
     * ```typescript
     * const updatedNode = tsProvider.updateModuleSpecifier(importNode, './src/index.ts');
     * console.log(updatedNode.moduleSpecifier.text); // './module.js'
     * ```
     */

    private updateModuleSpecifier(node: Node, sourceFile: string): Node {
        const newModuleSpecifier = factory.createStringLiteral(sourceFile);

        if (isImportDeclaration(node)) {
            return factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                newModuleSpecifier,
                undefined
            );
        } else if (isExportDeclaration(node)) {
            return factory.updateExportDeclaration(
                node,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                newModuleSpecifier,
                undefined
            );
        }

        return node;
    }

    /**
     * Creates a visitor function that transforms `ImportDeclaration` and `ExportDeclaration` nodes by updating
     * their module specifiers to relative paths based on the output directory.
     *
     * This method returns a visitor function, which is used to traverse and transform the nodes in a TypeScript
     * `SourceFile`. The visitor identifies `ImportDeclaration` and `ExportDeclaration` nodes with module specifiers
     * that are string literals. For these nodes, the module specifiers are resolved to their corresponding file paths
     * and updated to relative paths that align with the output directory.
     *
     * The visitor is designed to recursively visit all nodes in the `SourceFile`, transforming only the relevant
     * import and export declarations while leaving other nodes unchanged.
     *
     * @param sourceFile - The TypeScript `SourceFile` that will be traversed by the visitor.
     * @param context - The transformation context provided by the TypeScript compiler, used for visiting nodes.
     *
     * @returns A visitor function that processes the nodes in the source file, updating module specifiers as needed.
     *
     * @example
     * ```typescript
     * const visitor = tsProvider.createVisitor(sourceFile, context);
     * const transformedNode = visitor(importNode);
     * console.log(transformedNode); // ImportDeclaration with updated module specifier
     * ```
     */

    private createVisitor(sourceFile: SourceFile, context: TransformationContext): (node: Node) => Node {
        // Define the visitor function that will handle transformations
        const visitNode = (node: Node | ImportDeclaration | ExportDeclaration): Node => {
            // Example transformation: replace import/export module specifiers with relative paths
            if (this.isImportOrExportDeclaration(node) && this.hasStringLiteralModuleSpecifier(node)) {
                const specifierText = ((<ImportDeclaration> node).moduleSpecifier as StringLiteral).text;
                const resolvedTargetFile = this.resolveModuleFileName(specifierText, this.options);

                if (resolvedTargetFile) {
                    const relativePath = this.getRelativePathToOutDir(sourceFile.fileName, resolvedTargetFile);

                    return this.updateModuleSpecifier(node as Node & { moduleSpecifier: StringLiteral }, relativePath);
                }
            }

            // Recursively visit each child node
            return visitEachChild(node, visitNode, context);
        };

        // Return the visitor function
        return visitNode;
    }

    /**
     * Creates a custom transformer factory for TypeScript that processes `SourceFile` nodes.
     *
     * This method returns a custom transformer factory function which generates a transformer that can be used
     * during the TypeScript compilation process. The transformer specifically processes `SourceFile` nodes to
     * apply custom transformations and does not alter `Bundle` nodes.
     *
     * The factory function generates a transformer that performs the following:
     * - **Transforming `SourceFile` nodes**: Uses the `createVisitor` method to visit and transform all nodes in
     *   a `SourceFile`. This allows custom modifications or analysis of TypeScript source files.
     * - **No transformation for `Bundle` nodes**: The `transformBundle` method returns the bundle unchanged, as
     *   no specific transformation is needed for bundles in this implementation.
     *
     * This transformer factory is used primarily for customizing TypeScript file transformations, such as updating
     * module specifiers or other source-level adjustments during the compilation process.
     *
     * @returns A custom transformer factory function that produces a `CustomTransformer` object. This object
     *          implements the `transformSourceFile` and `transformBundle` methods.
     *
     * @example
     * ```typescript
     * const transformerFactory = tsProvider.createTransformerFactory();
     * const emitResult = program.emit(undefined, undefined, undefined, true, {
     *     after: [transformerFactory]
     * });
     * ```
     */

    private createTransformerFactory(): CustomTransformerFactory {
        return (context: TransformationContext): CustomTransformer => {
            return {
                // Transform the source file by visiting all nodes
                transformSourceFile: (sourceFile: SourceFile): SourceFile => {
                    return visitEachChild(sourceFile, this.createVisitor(sourceFile, context), context);
                },

                // Required for transformers but usually not necessary for us to implement
                transformBundle: (bundle: Bundle): Bundle => {
                    return bundle; // No transformation needed for bundles in this case
                }
            };
        };
    }

    /**
     * Handles and logs TypeScript diagnostics, providing detailed error messages with file and position information.
     *
     * This method processes an array of TypeScript diagnostics, printing formatted error messages to the console.
     * If a diagnostic is associated with a specific file and position, the error message includes the filename,
     * line, and character information. Colors are applied to highlight different parts of the message, such as
     * file paths, positions, error messages, and error codes.
     *
     * If the `allowError` flag is `false`, the method throws an error when diagnostics are present, indicating
     * that type checking has failed. If `allowError` is `true`, errors are logged but not thrown, allowing the process
     * to continue despite the diagnostics.
     *
     * @param diagnostics - An array of readonly `Diagnostic` objects returned by the TypeScript compiler.
     * These diagnostics contain information about errors or warnings that occurred during compilation.
     *
     * @param allowError - A boolean flag that determines whether the method should throw an error when diagnostics
     * are encountered. If set to `true`, the method logs diagnostics but does not throw an error. Defaults to `false`.
     *
     * @throws Will throw an error if diagnostics are present and `allowError` is set to `false`. The error
     * indicates that type checking has failed.
     *
     * @example
     * ```typescript
     * const diagnostics = program.getSemanticDiagnostics();
     * handleDiagnostics(diagnostics, false); // Throws an error if any diagnostics exist.
     * ```
     */

    private handleDiagnostics(diagnostics: readonly Diagnostic[], allowError: boolean = false): void {
        if (diagnostics.length === 0)
            return;

        diagnostics.forEach(diagnostic => {
            if (diagnostic.file && diagnostic.start !== undefined) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                const message = flattenDiagnosticMessageText(diagnostic.messageText, '\n');

                const file = setColor(Colors.Cyan, diagnostic.file.fileName, this.activeColor);
                const position = setColor(Colors.LightYellow, `${ line + 1 }:${ character + 1 }`, this.activeColor);
                const errorMsg = setColor(Colors.Red, 'error', this.activeColor);
                const errorCode = setColor(Colors.Gray, `TS${ diagnostic.code }`, this.activeColor);

                console.log(`${ prefix() } ${ file }:${ position } - ${ errorMsg } ${ errorCode }:${ message }`);
            } else {
                console.error(flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            }
        });

        console.log('\n');
        if (!allowError) {
            throw new TypesError('Type checking failed due to errors.');
        }
    }
}
