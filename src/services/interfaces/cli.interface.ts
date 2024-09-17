/**
 * Interface representing the command-line arguments for the build tool.
 *
 * @interface ArgvInterface
 * @property file - The file entryPoints to build.
 * @property dev - Flag indicating if the build is for development.
 * @property serve - Flag indicating if an HTTP server should be started for the build folder.
 * @property outdir - The output directory for the build files.
 * @property declaration - Flag indicating if TypeScript declaration files should be generated.
 * @property watch - Flag indicating if the build should watch for file changes.
 * @property config - Path to the build configuration file (JavaScript or TypeScript).
 * @property tsconfig - Path to the TypeScript configuration file to use.
 * @property minify - Flag indicating if the code should be minified.
 * @property bundle - Flag indicating if the code should be bundled.
 */

export interface ArgvInterface {
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
    bundle: boolean
}
