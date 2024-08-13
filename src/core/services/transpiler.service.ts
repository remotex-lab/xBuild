/**
 * Import will remove at compile time
 */

import type { BuildOptions, Metafile } from 'esbuild';
import type { transpileFileInterface } from '@core/services/interfaces/transpiler.interface';

/**
 * Imports
 */

import { cwd } from 'process';
import { build } from 'esbuild';

/**
 * Default build options for esbuild bundler in RemoteX framework.
 *
 * These options are used to configure how esbuild processes and bundles the TypeScript
 * files for the RemoteX testing framework.
 *
 * @property write - If true, esbuild writes the output files to the file system.
 *                   If false, the output is kept in memory.
 * @property bundle - If true, esbuild bundles all dependencies into the output files.
 *                    This creates a single file that contains all the necessary code.
 * @property minify - If true, esbuild minifies the output files, reducing their size
 *                    by removing whitespace and other unnecessary characters.
 * @property format - The output format for the bundled code. 'cjs' stands for CommonJS,
 *                    which is suitable for Node.js environments.
 * @property target - The ECMAScript target version for the output code. 'esnext' means
 *                    the latest ECMAScript version.
 * @property platform - The platform for which the code is being bundled. 'node' means
 *                      the code is intended to run in a Node.js environment.
 * @property sourcemap - If true, esbuild generates source maps for the output files.
 *                       Source maps help with debugging by mapping the minified code
 *                       back to the original source code.
 * @property sourcesContent - If true, esbuild includes the original source content in
 *                            the source maps. This makes debugging easier by embedding
 *                            the original source code within the source maps.
 * @property preserveSymlinks - If true, esbuild preserves symbolic links when resolving
 *                              module paths. This can be important for certain project
 *                              structures or when using tools like Yarn Plug'n'Play.
 */

export const defaultBuildOptions: BuildOptions = {
    write: false,
    bundle: true,
    minify: true,
    format: 'cjs',
    target: 'esnext',
    platform: 'node',
    sourcemap: true,
    sourcesContent: true,
    preserveSymlinks: true
};

/**
 * Extracts the source map from the provided data string and returns the modified code and source map separately.
 *
 * This function searches for the inline source map in the data string using a regular expression, removes the
 * source map comment from the data string, and returns an object containing the code without the source map
 * comment and the extracted source map.
 *
 * @param dataString - The string containing the transpiled code with an inline source map.
 * @returns An object containing the modified code without the source map comment and the extracted source map.
 * @throws Error - If the source map URL is not found in the data string.
 */

export function extractSourceMap(dataString: string): transpileFileInterface {
    const sourceMapRegex = /\/\/# sourceMappingURL=data:application\/json;base64,([^'"\s]+)/;
    const match = dataString.match(sourceMapRegex);

    if (!match || !match[1]) {
        throw new Error('Source map URL not found in the output.');
    }

    const sourceMap = match[1];
    const codeWithoutSourceMap = dataString.replace(sourceMapRegex, '');

    return { code: codeWithoutSourceMap, sourceMap };
}

/**
 * Transpiles a TypeScript file and extracts the source map.
 *
 * This function uses esbuild to transpile the specified TypeScript file based on provided build options,
 * and then extracts the source map from the transpiled code.
 *
 * @param filePath - The path to the TypeScript file to be transpiled.
 * @param buildOptions - Optional build options to override the default build options.
 * @returns - A promise that resolves to an object containing the transpiled code and the extracted source map.
 * @throws Error - If the build process fails or the source map extraction fails.
 */

export async function transpileFile(filePath: string, buildOptions: BuildOptions = {}): Promise<transpileFileInterface> {
    const options: BuildOptions = {
        absWorkingDir: cwd(),
        ...defaultBuildOptions,
        ...buildOptions,
        entryPoints: [ filePath ]
    };

    const result = await build(options);
    const fileContent = result.outputFiles?.pop()?.text ?? '';

    // Retrieve the transpiled code from the build output.
    return extractSourceMap(fileContent);
}

/**
 * Analyzes the dependencies of a given entry point using esbuild.
 *
 * This function bundles the specified entry point without writing the output files to disk.
 * Instead, it generates a metafile that contains detailed information about the dependencies
 * and imports used in the bundled code. The metafile is returned as a result of the analysis.
 *
 * @param entryPoint - The path to the entry point file that should be analyzed.
 * @param platform - The platform for which the code is being analyzed.
 *        'browser' indicates that the code is intended for a browser environment,
 *        'node' indicates a Node.js environment, and 'neutral' is platform-agnostic.
 * @returns A promise that resolves to the metafile containing the analysis of dependencies.
 * @throws If the build process fails for any reason.
 */

export async function analyzeDependencies(entryPoint: string, platform: 'browser' | 'node' | 'neutral' = 'browser'): Promise<Metafile> {
    const result = await build({
        entryPoints: [ entryPoint ],
        bundle: true, // Bundle to analyze imports
        write: false, // Prevent writing output files
        metafile: true, // Generate a metafile to analyze dependencies
        platform: platform,
        logLevel: 'silent'
    });

    return result.metafile;
}
