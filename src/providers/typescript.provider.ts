/**
 * Import will remove at compile time
 */

import type { NodeWithModifiersType } from '@providers/interfaces/typescript-provider.interface';

/**
 * Imports
 */
import * as ts from 'typescript';
import { TypesError } from '@errors/types.error';
import { prefix } from '@components/banner.component';
import { Colors, setColor } from '@components/colors.component';
import { dirname, join, parse, relative, resolve, normalize } from 'path';

/**
 * A record of updater functions that add export modifiers to different TypeScript node types.
 * Each function takes a TypeScript node and its existing modifiers, then returns a new node
 * with the export modifier added at the beginning of the modifier array.
 *
 * @param node - The TypeScript node to be updated with export modifiers
 * @param mods - The existing modifiers of the node, if any
 * @returns A new TypeScript node with the export modifier added
 *
 * @throws TypeError - When provided with an incompatible node type
 *
 * @example
 * ```ts
 * const classNode = ts.factory.createClassDeclaration(
 *   undefined, "MyClass", undefined, undefined, []
 * );
 * const exportedClassNode = nodeUpdaters.ClassDeclaration(classNode, undefined);
 * ```
 *
 * @see ts.Node
 * @see ts.Modifier
 *
 * @since 1.5.5
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeUpdaters: Record<string, (node: any, mods: ts.Modifier[] | undefined) => ts.Node> = {
    ClassDeclaration: (n: ts.ClassDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
        const updatedMods = mods ? [ exportModifier, declareModifier, ...mods ] : [ exportModifier, declareModifier ];

        return ts.factory.updateClassDeclaration(
            n, updatedMods, n.name, n.typeParameters, n.heritageClauses, n.members
        );
    },

    InterfaceDeclaration: (n: ts.InterfaceDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const updatedMods = mods ? [ exportModifier, ...mods ] : [ exportModifier ];

        return ts.factory.updateInterfaceDeclaration(
            n, updatedMods, n.name, n.typeParameters, n.heritageClauses, n.members
        );
    },

    EnumDeclaration: (n: ts.EnumDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
        const updatedMods = mods ? [ exportModifier, declareModifier, ...mods ] : [ exportModifier, declareModifier ];

        return ts.factory.updateEnumDeclaration(
            n, updatedMods, n.name, n.members
        );
    },

    FunctionDeclaration: (n: ts.FunctionDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
        const updatedMods = mods ? [ exportModifier, declareModifier, ...mods ] : [ exportModifier, declareModifier ];

        return ts.factory.updateFunctionDeclaration(
            n, updatedMods, n.asteriskToken, n.name, n.typeParameters, n.parameters, n.type, n.body
        );
    },

    TypeAliasDeclaration: (n: ts.TypeAliasDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const updatedMods = mods ? [ exportModifier, ...mods ] : [ exportModifier ];

        return ts.factory.updateTypeAliasDeclaration(
            n, updatedMods, n.name, n.typeParameters, n.type
        );
    },

    VariableStatement: (n: ts.VariableStatement, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const declareModifier = ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword);
        const updatedMods = mods ? [ exportModifier, declareModifier, ...mods ] : [ exportModifier, declareModifier ];

        return ts.factory.updateVariableStatement(
            n, updatedMods, n.declarationList
        );
    },

    ModuleDeclaration: (n: ts.ModuleDeclaration, mods) => {
        const exportModifier = ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);
        const updatedMods = mods ? [ exportModifier, ...mods ] : [ exportModifier ];

        return ts.factory.updateModuleDeclaration(
            n, updatedMods, n.name, n.body
        );
    }
};

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
 * ```ts
 * const tsProvider = new TypescriptProvider(parsedConfig, './dist');
 * tsProvider.typeCheck(entryPoints);
 * tsProvider.generateDeclarations(entryPoints);
 * ```
 */

export class TypeScriptProvider {

    /**
     * Compiler options for configuring TypeScript compilation.
     */

    readonly options: ts.CompilerOptions;

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
     * ```ts
     * const tsProvider = new TypescriptProvider(parsedConfig, './dist');
     * ```
     *
     * @example
     * ```ts
     * const tsProvider = new TypescriptProvider(parsedConfig, './dist', false);
     * // This instance will not apply ANSI color formatting in output messages
     * ```
     */

    constructor(public tsConfig: ts.ParsedCommandLine, private outDir: string, private activeColor: boolean = true) {
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
     * `true`, errors are logged but not thrown, allowing the process to continue. Default to `false`, which throws
     * an error if diagnostics are encountered.
     *
     * @returns void
     *
     * @throws Throws an error if type-checking fails due to TypeScript diagnostics and `allowError` is `false`.
     * The error indicates that the type-checking process has encountered issues.
     *
     * @example
     * ```ts
     * // Type-check files and handle any diagnostics
     * tsProvider.typeCheck(['src/index.ts', 'src/app.ts']);
     * ```
     */

    typeCheck(allowError: boolean = false): void {
        const program = ts.createProgram(this.tsConfig.fileNames, {
            ...this.options,
            noEmit: true,
            skipLibCheck: true,
            emitDeclarationOnly: true
        });

        this.handleDiagnostics(ts.getPreEmitDiagnostics(program), allowError);
    }

    /**
     * Generates declaration files (.d.ts) for bundle entry points.
     *
     * @param entryPoints - Map of output declaration file paths to their corresponding input source files
     * @param noTypeChecker - When true, skips type checking during generation (default: false)
     * @param allowError - When true, continues generation even if type errors are found (default: false)
     *
     * @throws Error - If type errors are found and allowError is false
     *
     * @remarks
     * This method creates TypeScript declaration files for each entry point specified in the record.
     * For each entry point:
     *
     * 1. Create a TypeScript program with input file
     * 2. Configure the program to emit declaration files only
     * 3. Applies custom transformers to clean up declarations
     * 4. Performs type checking (unless disabled)
     * 5. Emits the declaration file to the specified output path
     *
     * The generated declarations are processed by the cleanupDeclarations transformer,
     * which removes export modifiers and performs another necessary cleanup.
     *
     * Type errors will normally cause the process to fail unless allowError is set to true.
     *
     * @example
     * ```ts
     * // Generate declarations for multiple entry points
     * generator.generateBundleDeclarations({
     *   './dist/index.d.ts': './src/index.ts',
     *   './dist/core.d.ts': './src/core.ts'
     * });
     * ```
     *
     * @since 1.5.5
     */


    generateBundleDeclarations(entryPoints: Record<string, string>, noTypeChecker = false, allowError: boolean = false): void {
        const config = {
            ...this.options,
            rootDir: this.options.baseUrl,
            declaration: true,
            skipLibCheck: true,
            emitDeclarationOnly: true
        };

        let files = this.tsConfig.fileNames;
        if(!this.tsConfig.raw.include && !this.tsConfig.raw.files) {
            files = [];
        }

        Object.entries(entryPoints).forEach(([ output, input ]) => {
            config.outFile = join(this.outDir, output);
            const program = ts.createProgram(files.concat(input), config);

            const customTransformers: ts.CustomTransformers = {
                afterDeclarations: [ this.cleanupDeclarations() ]
            };

            // Collect diagnostics and check for errors
            const diagnostics = ts.getPreEmitDiagnostics(program);
            if (!noTypeChecker && diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) {
                this.handleDiagnostics(diagnostics, allowError);
            }

            program.emit(
                undefined, // no specific sourceFile
                undefined, // no specific writeFile
                undefined, // no cancellationToken
                undefined, // emitOnlyDtsFiles is not used when emitDeclarationOnly is true
                customTransformers
            );
        });
    }

    /**
     * Generates TypeScript declaration files (`.d.ts`) for the specified entry points.
     *
     * This method compiles the provided TypeScript files and emits only the declaration files, without generating
     * JavaScript code. It applies a custom transformer to modify module specifiers to relative paths based on the
     * output directory. This ensures that the generated declaration files are accurate and the module paths are
     * aligned with the project's build structure.
     *
     * @param entryPoints - Map of output declaration file paths to their corresponding input source files
     * @param noTypeChecker - Skips TypeScript type checking.
     * @param allowError - A boolean flag indicating whether to throw an error if diagnostics are present. If set to
     * `true`, errors are logged but not thrown, allowing the process to continue. Default to `false`, which throws
     * an error if diagnostics are encountered.
     *
     * @returns void
     *
     * @example
     * ```ts
     * // Generate declaration files for specific entry points
     * tsProvider.generateDeclarations(['src/index.ts', 'src/app.ts']);
     * ```
     */

    generateDeclarations(entryPoints: Record<string, string>, noTypeChecker = false, allowError: boolean = false): void {
        const program = ts.createProgram([ ...this.tsConfig.fileNames, ...Object.values(entryPoints) ], {
            ...this.options,
            rootDir: this.options.baseUrl,
            declaration: true,
            skipLibCheck: true,
            emitDeclarationOnly: true
        });

        // Collect diagnostics and check for errors
        const diagnostics = ts.getPreEmitDiagnostics(program);
        if (!noTypeChecker && diagnostics.some(diagnostic => diagnostic.category === ts.DiagnosticCategory.Error)) {
            this.handleDiagnostics(diagnostics, allowError);
        }

        // Emit declarations if no type errors were found
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
     * ```ts
     * const isDeclaration = tsProvider.isImportOrExportDeclaration(node);
     * console.log(isDeclaration); // true or false
     * ```
     */

    private isImportOrExportDeclaration(node: ts.Node): boolean {
        return ts.isImportDeclaration(node) || ts.isExportDeclaration(node);
    }

    /**
     * Checks if the provided node has a string literal as its module specifier.
     *
     * @param node - A TypeScript AST node to check.
     *
     * @returns `true` if the node has a string literal module specifier; otherwise, `undefined`.
     *
     * @example
     * ```ts
     * const hasModuleSpecifier = tsProvider.hasStringLiteralModuleSpecifier(importNode);
     * console.log(hasModuleSpecifier); // true or undefined
     * ```
     */

    private hasStringLiteralModuleSpecifier(node: ts.Node): boolean | undefined {
        return (<ts.ImportDeclaration> node).moduleSpecifier && ts.isStringLiteral((<ts.ImportDeclaration> node).moduleSpecifier);
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
     * ```ts
     * const resolvedPath = tsProvider.resolveModuleFileName('./module', compilerOptions);
     * console.log(resolvedPath); // './dist/module.js'
     * ```
     */

    private resolveModuleFileName(specifierText: string, options: ts.CompilerOptions): string | undefined {
        let path = undefined;
        const resolvedModule = ts.resolveModuleName(specifierText, options.baseUrl!, options, ts.sys);

        if (resolvedModule.resolvedModule && options.baseUrl) {
            if (resolvedModule.resolvedModule.resolvedFileName.includes('node_modules'))
                return path;

            path = resolve(resolvedModule.resolvedModule.resolvedFileName).replace(
                resolve(options.baseUrl), '.'
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
     * ```ts
     * const relativePath = tsProvider.getRelativePathToOutDir('./src/index.ts', './dist/module.js');
     * console.log(relativePath); // './module.js'
     * ```
     */

    private getRelativePathToOutDir(sourceFile: string, resolvedTargetFile: string): string {
        sourceFile = resolve(sourceFile).replace(resolve(this.options.baseUrl ?? ''), '.');
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
     * ```ts
     * const updatedNode = tsProvider.updateModuleSpecifier(importNode, './src/index.ts');
     * console.log(updatedNode.moduleSpecifier.text); // './module.js'
     * ```
     */

    private updateModuleSpecifier(node: ts.Node, sourceFile: string): ts.Node {
        const newModuleSpecifier = ts.factory.createStringLiteral(sourceFile);

        if (ts.isImportDeclaration(node)) {
            return ts.factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                newModuleSpecifier,
                undefined
            );
        } else if (ts.isExportDeclaration(node)) {
            return ts.factory.updateExportDeclaration(
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
     * ```ts
     * const visitor = tsProvider.createVisitor(sourceFile, context);
     * const transformedNode = visitor(importNode);
     * console.log(transformedNode); // ImportDeclaration with updated module specifier
     * ```
     */

    private createVisitor(sourceFile: ts.SourceFile, context: ts.TransformationContext): (node: ts.Node) => ts.Node {
        // Define the visitor function that will handle transformations
        const visitNode = (node: ts.Node | ts.ImportDeclaration | ts.ExportDeclaration): ts.Node => {
            // Example transformation: replace import/export module specifiers with relative paths
            if (this.isImportOrExportDeclaration(node) && this.hasStringLiteralModuleSpecifier(node)) {
                const specifierText = ((<ts.ImportDeclaration> node).moduleSpecifier as ts.StringLiteral).text;
                const resolvedTargetFile = this.resolveModuleFileName(specifierText, this.options);

                if (resolvedTargetFile) {
                    const relativePath = this.getRelativePathToOutDir(sourceFile.fileName, resolvedTargetFile);

                    return this.updateModuleSpecifier(node as ts.Node & {
                        moduleSpecifier: ts.StringLiteral
                    }, relativePath);
                }
            }

            // Recursively visit each child node
            return ts.visitEachChild(node, visitNode, context);
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
     * ```ts
     * const transformerFactory = tsProvider.createTransformerFactory();
     * const emitResult = program.emit(undefined, undefined, undefined, true, {
     *     after: [transformerFactory]
     * });
     * ```
     */

    private createTransformerFactory(): ts.CustomTransformerFactory {
        return (context: ts.TransformationContext): ts.CustomTransformer => {
            return {
                // Transform the source file by visiting all nodes
                transformSourceFile: (sourceFile: ts.SourceFile): ts.SourceFile => {
                    return ts.visitEachChild(sourceFile, this.createVisitor(sourceFile, context), context);
                },

                // Required for transformers but usually not necessary for us to implement
                transformBundle: (bundle: ts.Bundle): ts.Bundle => {
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
     * ```ts
     * const diagnostics = program.getSemanticDiagnostics();
     * handleDiagnostics(diagnostics, false); // Throws an error if any diagnostics exist.
     * ```
     */

    private handleDiagnostics(diagnostics: readonly ts.Diagnostic[], allowError: boolean = false): void {
        if (diagnostics.length === 0)
            return;

        diagnostics.forEach(diagnostic => {
            if (diagnostic.file && diagnostic.start !== undefined) {
                const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

                const file = setColor(Colors.Cyan, diagnostic.file.fileName, this.activeColor);
                const position = setColor(Colors.LightYellow, `${ line + 1 }:${ character + 1 }`, this.activeColor);
                const errorMsg = setColor(Colors.Red, 'error', this.activeColor);
                const errorCode = setColor(Colors.Gray, `TS${ diagnostic.code }`, this.activeColor);

                console.error(`${ prefix() } ${ file }:${ position } - ${ errorMsg } ${ errorCode }:${ message }`);
            } else {
                console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            }
        });

        console.log('\n');
        if (!allowError) {
            throw new TypesError('Type checking failed due to errors.');
        }
    }

    /**
     * Type guard to check if a node is one that can have modifiers.
     *
     * @param node - The TypeScript node to check
     * @returns True if the node is a type that can have modifiers, false otherwise
     *
     * @remarks
     * This type guard function identifies node types that can potentially have
     * modifiers like 'export', 'default', etc. It's used in the AST transformation
     * process to identify nodes where export modifiers need to be removed.
     *
     * The supported node types include:
     * - Class declarations
     * - Interface declarations
     * - Enum declarations
     * - Function declarations
     * - Type alias declarations
     * - Variable statements
     * - Module declarations
     *
     * @see NodeWithModifiersType
     * @see ts.Node
     *
     * @since 1.5.5
     */

    private isNodeWithModifiers(node: ts.Node): node is NodeWithModifiersType {
        return (
            ts.isClassDeclaration(node) ||
            ts.isInterfaceDeclaration(node) ||
            ts.isEnumDeclaration(node) ||
            ts.isFunctionDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isVariableStatement(node) ||
            ts.isModuleDeclaration(node)
        );
    }

    /**
     * Filters out export and default modifiers from an array of TypeScript modifiers.
     *
     * @param modifiers - Optional array of TypeScript modifiers to process
     * @returns A new array without export/default modifiers, or undefined if no modifiers remain
     *
     * @remarks
     * This helper method is used when transforming nodes to remove export-related functionality.
     * It returns undefined instead of an empty array when no modifiers remain to ensure
     * proper TypeScript AST structure.
     *
     * @example
     * ```ts
     * // Input: [export, const]
     * // Output: [const]
     *
     * // Input: [export]
     * // Output: undefined
     * ```
     *
     * @see ts.Modifier
     * @see ts.SyntaxKind.ExportKeyword
     * @see ts.SyntaxKind.DefaultKeyword
     *
     * @since 1.5.5
     */

    private removeExportModifiers(modifiers?: readonly ts.Modifier[]): ts.Modifier[] | undefined {
        if (!modifiers) return undefined;

        const newModifiers = modifiers.filter(
            m => m.kind !== ts.SyntaxKind.ExportKeyword && m.kind !== ts.SyntaxKind.DefaultKeyword
        );

        return newModifiers.length ? newModifiers : undefined;
    }

    /**
     * Updates a node by removing its export modifiers.
     *
     * @param node - A TypeScript node that can have modifiers
     * @returns A new node with export and default modifiers removed
     *
     * @remarks
     * This method dynamically determines the node type and applies the appropriate
     * update function from the nodeUpdaters record.
     *
     * It works by:
     * 1. First, removing export modifiers using removeExportModifiers method
     * 2. Identifying the node type by matching it against TypeScript's type guards
     * 3. Applying the corresponding updater function from nodeUpdaters
     * 4. Falling back to returning the original node if no updater is found
     *
     * The dynamic approach avoids repetitive code for each node type while still
     * maintaining type safety through TypeScript's built-in type guards.
     *
     * @see nodeUpdaters
     * @see removeExportModifiers
     * @see NodeWithModifiersType
     *
     * @since 1.5.5
     */

    private updateNodeWithoutExports(node: NodeWithModifiersType): ts.Node {
        const newModifiers = this.removeExportModifiers(<readonly ts.Modifier[] | undefined> node.modifiers);

        // Get the node kind name without the "is" prefix
        for (const [ nodeType, updater ] of Object.entries(nodeUpdaters)) {
            const typeGuardFn = <(node: ts.Node) => boolean> ts[`is${ nodeType }` as keyof typeof ts];
            if (typeof typeGuardFn === 'function' && typeGuardFn(node)) {
                return updater(node, newModifiers);
            }
        }

        // Fallback for any other node types
        return node;
    }

    /**
     * Recursively visits and transforms nodes in the TypeScript AST.
     *
     * @param context - The transformation context provided by TypeScript
     * @param node - The current node being visited
     * @returns A transformed node with export modifiers removed where applicable
     *
     * @remarks
     * This method is the core of the AST transformation process.
     *
     * It:
     * 1. Checks if the current node is one that can have modifiers
     * 2. If so, checks if it has any export or default modifiers
     * 3. If export modifiers are found, remove them using updateNodeWithoutExports
     * 4. Recursively visit all child nodes regardless of whether the current node was modified
     *
     * The recursion ensures that all nodes in the entire syntax tree are processed,
     * resulting in a complete transformation that removes all export modifiers.
     *
     * @see isNodeWithModifiers
     * @see updateNodeWithoutExports
     * @see ts.visitEachChild
     *
     * @since 1.5.5
     */

    private visitNode(context: ts.TransformationContext, node: ts.Node): ts.Node {
        // Remove export modifiers from declarations
        if (this.isNodeWithModifiers(node) && node.modifiers) {
            const hasExportModifiers = node.modifiers.some(
                m => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword
            );

            if (hasExportModifiers) {
                return this.updateNodeWithoutExports(node);
            }
        }

        // Visit each child node
        return ts.visitEachChild(
            node,
            childNode => this.visitNode(context, childNode),
            context
        );
    }

    /**
     * Processes top-level TypeScript statements by handling imports, exports, and module declarations
     * during transformation. This method filters internal imports, removes exports, and flattens module
     * declarations to generate optimized output.
     *
     * @param node - The TypeScript statement being processed
     * @param importMap - Collection of import clauses organized by module specifier
     * @param sourceFiles - Array of internal source file paths that should be excluded
     * @param context - TypeScript transformation context for node factory operations
     * @returns Array of transformed statements or empty array if the statement is removed
     *
     * @throws TypesError - When encountering unsupported node types
     *
     * @remarks
     * The transformation logic handles several specific cases:
     * - Import declarations: Collects external imports and filters internal ones
     * - Import equals declarations: Removes them from output
     * - Export declarations: Removes them entirely
     * - Module declarations: Unwraps content from declare modules, preserves others
     *
     * @example
     * ```ts
     * const result = this.visitTopLevelStatement(
     *   sourceFile.statements[0],
     *   new Map<string, Array<ts.ImportClause>>(),
     *   ['./internal-module'],
     *   transformContext
     * );
     * ```
     *
     * @see ts.Statement
     * @see ts.ImportDeclaration
     * @see ts.ModuleDeclaration
     *
     * @since 1.5.5
     */

    private visitTopLevelStatement(
        node: ts.Statement, importMap: Map<string, Array<ts.ImportClause>>, sourceFiles: Array<string>, context: ts.TransformationContext
    ): ts.Statement[] {
        // Handle imports: collect external ones, remove internal ones
        if (ts.isImportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                const moduleSpecifier = node.moduleSpecifier.text;

                if(sourceFiles.includes(normalize(moduleSpecifier))) {
                    return [];
                }

                if(node.importClause) {
                    if (!importMap.has(moduleSpecifier)) {
                        importMap.set(moduleSpecifier, []);
                    }

                    importMap.get(moduleSpecifier)!.push(node.importClause!);
                }
            }

            return [];
        }

        // Remove import equals declarations
        if (ts.isImportEqualsDeclaration(node)) {
            return [];
        }

        // Remove export declarations entirely
        if (ts.isExportDeclaration(node)) {
            return [];
        }

        // Handle module declarations (unnest the contents)
        if (ts.isModuleDeclaration(node)) {
            // If this is a "declare module" statement
            if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DeclareKeyword)) {
                // Extract the statements from inside the module
                if (node.body && ts.isModuleBlock(node.body)) {
                    return node.body.statements.flatMap(stmt =>
                        this.visitTopLevelStatement(stmt, importMap, sourceFiles, context)
                    );
                }

                return [];
            }

            return [ this.visitNode(context, node) as ts.Statement ];
        }

        // Handle any other type of statement
        return [ this.visitNode(context, node) as ts.Statement ];
    }

    /**
     * Transforms a TypeScript source file by processing all its top-level statements and
     * updating the source file with the processed statements while preserving metadata.
     *
     * @param sourceFile - The TypeScript source file to transform
     * @param importMap - Collection mapping module specifiers to their import clauses
     * @param sourceFiles - Array of source file paths used to identify internal modules
     * @param context - The TypeScript transformation context
     * @returns A new TypeScript source file with transformed statements
     *
     * @remarks
     * This method flattens all source file statements by passing them through the
     * visitTopLevelStatement processor, then creates an updated source file that
     * preserves all original metadata including declaration status and references.
     *
     * @example
     * ```ts
     * const transformedFile = this.visitSourceFile(
     *   program.getSourceFile("main.ts"),
     *   new Map<string, Array<ts.ImportClause>>(),
     *   ["./src/internal.ts"],
     *   transformationContext
     * );
     * ```
     *
     * @throws TypesError - When transformation encounters incompatible node types
     *
     * @see ts.SourceFile
     * @see ts.TransformationContext
     *
     * @since 1.5.5
     */

    private visitSourceFile(
        sourceFile: ts.SourceFile,
        importMap: Map<string, Array<ts.ImportClause>>,
        sourceFiles: Array<string>,
        context: ts.TransformationContext
    ): ts.SourceFile {
        const statements = sourceFile.statements.flatMap(stmt =>
            this.visitTopLevelStatement(stmt, importMap, sourceFiles, context)
        );

        return ts.factory.updateSourceFile(
            sourceFile,
            statements,
            sourceFile.isDeclarationFile,
            sourceFile.referencedFiles,
            sourceFile.typeReferenceDirectives,
            sourceFile.hasNoDefaultLib,
            sourceFile.libReferenceDirectives
        );
    }

    /**
     * Merges multiple TypeScript import clauses into a single consolidated import clause,
     * handling default imports, named imports, and namespace imports.
     *
     * @param importClauses - Array of import clauses to merge
     * @param isTypeOnly - Whether to force the resulting import to be type-only, defaults to true
     * @returns A consolidated import clause or undefined if no import clauses provided
     *
     * @throws TypesError - When encountering incompatible import clause structures
     *
     * @remarks
     * The merging process follows these rules:
     * - Uses the first default import encountered
     * - Collects all unique named imports across all clauses
     * - Uses the first namespace import encountered
     * - Handles type-only status according to the isTypeOnly parameter or source clauses
     * - Returns undefined if the input array is empty
     * - Returns the original clause if there's only one and not forcing type-only
     *
     * @example
     * ```ts
     * const imports = [
     *   ts.factory.createImportClause(false, ts.factory.createIdentifier("default1"), undefined),
     *   ts.factory.createImportClause(
     *     false,
     *     undefined,
     *     ts.factory.createNamedImports([
     *       ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("named1"))
     *     ])
     *   )
     * ];
     * const mergedImport = this.mergeImportClauses(imports, true);
     * ```
     *
     * @see ts.ImportClause
     * @see ts.NamedImports
     * @see ts.NamespaceImport
     *
     * @since 1.5.6
     */

    private mergeImportClauses(importClauses: ts.ImportClause[], isTypeOnly: boolean = true): ts.ImportClause | undefined {
        if (importClauses.length === 0) {
            return undefined;
        }

        if (importClauses.length === 1 && !isTypeOnly) {
            return importClauses[0];
        }

        // Extract all components from import clauses
        let defaultImport: ts.Identifier | undefined;
        // If isTypeOnly is true, we force type imports, otherwise we keep original behavior
        let finalIsTypeOnly = isTypeOnly;
        if (!isTypeOnly) {
            finalIsTypeOnly = importClauses.some(clause => clause.isTypeOnly);
        }

        const namedImportElements = new Map<string, ts.ImportSpecifier>();
        let namespaceImport: ts.NamespaceImport | undefined;

        // Process each import clause
        for (const clause of importClauses) {
            // Handle default import (use the first one found)
            if (clause.name && !defaultImport) {
                defaultImport = clause.name;
            }

            // Handle named imports
            if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
                for (const element of clause.namedBindings.elements) {
                    const elementName = element.name.text;
                    if (!namedImportElements.has(elementName)) {
                        namedImportElements.set(elementName, element);
                    }
                }
            }

            // Handle namespace import (use the first one found)
            if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings) && !namespaceImport) {
                namespaceImport = clause.namedBindings;
            }
        }

        // Create the appropriate namedBindings
        let namedBindings: ts.NamedImportBindings | undefined;

        if (namedImportElements.size > 0) {
            namedBindings = ts.factory.createNamedImports(Array.from(namedImportElements.values()));
        } else if (namespaceImport) {
            namedBindings = namespaceImport;
        }

        // Create and return the merged import clause with isTypeOnly flag set
        return ts.factory.createImportClause(
            finalIsTypeOnly, // Set to true for type-only imports
            defaultImport,
            namedBindings
        );
    }

    /**
     * Creates a transformer factory that cleans up declarations in TypeScript bundles.
     * This transformer extracts external imports from each source file in the bundle
     * and consolidates them into a single imports file at the beginning of the bundle.
     *
     * @returns A transformer factory function that transforms TypeScript bundles
     *
     * @throws Error - When the input is not a bundle but a single source file
     *
     * @remarks
     * The transformer processes each source file in the bundle, extracts external imports,
     * and creates a new bundle with all imports consolidated at the beginning.
     *
     * @example
     * ```ts
     * const transformer = myClass.cleanupDeclarations();
     * const result = ts.transform(bundle, [transformer]);
     * ```
     *
     * @see ts.TransformerFactory
     * @see ts.Bundle
     *
     * @since 1.5.5
     */

    private cleanupDeclarations(): ts.TransformerFactory<ts.SourceFile | ts.Bundle> {
        return (context) => {
            return (sourceFile) => {
                // Validate input is a bundle
                if (!ts.isBundle(sourceFile)) {
                    throw new Error('Cannot process a single file, expected a bundle');
                }

                const importMap: Map<string, Array<ts.ImportClause>> = new Map();
                const sourceFiles = sourceFile.sourceFiles.map(file => {
                    const path = parse(relative(this.options.baseUrl ?? '', file.fileName));

                    return normalize(`${ path.dir ? path.dir + '/' : '' }${ path.name }`);
                });

                // Process each source file
                const newSourceFiles = sourceFile.sourceFiles.map(file =>
                    this.visitSourceFile(file, importMap, sourceFiles, context)
                );

                const importStatements = Array.from(importMap.entries()).map(([ moduleSpecifier, importClauses ]) => {
                    return ts.factory.createImportDeclaration(
                        undefined,
                        this.mergeImportClauses(importClauses),
                        ts.factory.createStringLiteral(moduleSpecifier)
                    );
                });

                const importsFile = ts.factory.createSourceFile(
                    importStatements,
                    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
                    ts.NodeFlags.None
                );

                return ts.factory.createBundle([ importsFile, ...newSourceFiles ]);
            };
        };
    }
}
