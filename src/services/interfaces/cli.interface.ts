/**
 * Import will remove at compile time
 */

import type { Format } from 'esbuild';

/**
 * Interface representing the command-line arguments for the build tool.
 *
 * @interface ArgvInterface
 * @property typeCheck - Flag indicating if the tool should perform type checking only.
 * @property node - Flag indicating if the build is intended for Node.js environment.
 * @property file - The entry file(s) to build.
 * @property dev - List of development-related options for the build.
 * @property debug - List of debugging-related options for the build.
 * @property serve - Flag indicating if an HTTP server should be started for the build folder.
 * @property outdir - The output directory for the build files.
 * @property declaration - Flag indicating if TypeScript declaration files should be generated.
 * @property watch - Flag indicating if the build should watch for file changes.
 * @property config - Path to the build configuration file (JavaScript or TypeScript).
 * @property tsconfig - Path to the TypeScript configuration file to use.
 * @property minify - Flag indicating if the code should be minified.
 * @property bundle - Flag indicating if the code should be bundled.
 * @property format - Defines the formats for the build output.
 */

export interface ArgvInterface {
    typeCheck: boolean,
    node: boolean,
    file: string,
    dev: Array<string>,
    debug: Array<string>,
    serve: boolean,
    outdir: string,
    declaration: boolean,
    watch: boolean,
    config: string,
    tsconfig: string,
    minify: boolean,
    bundle: boolean,
    format: Format
}
