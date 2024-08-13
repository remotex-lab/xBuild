/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@components/interfaces/argv.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/**
 * Parses command-line arguments into an `ArgvInterface` object using `yargs`.
 *
 * This function configures `yargs` to handle various build-related options for a JavaScript and TypeScript toolchain.
 * It returns an object that adheres to the `ArgvInterface` structure based on the parsed arguments.
 *
 * @param argv - An array of command-line arguments (e.g., `process.argv`).
 * @returns An object representing the parsed command-line arguments.
 *
 * @see {@link ArgvInterface} for the structure of the returned object.
 *
 * @example
 * // Example usage:
 * const args = argvParser(process.argv);
 * console.log(args.file); // Output: the file to build
 * console.log(args.dev); // Output: true or false based on the --dev flag
 */

export function argvParser(argv: Array<string>): Argv<ArgvInterface> {
    return <Argv<ArgvInterface>> yargs(hideBin(argv))
        .command('$0 [file]', 'A versatile JavaScript and TypeScript toolchain build system.', (yargs) => {
            yargs
                .positional('entryPoints', {
                    describe: 'The file entryPoints to build',
                    type: 'string'
                })
                .option('node', {
                    alias: 'n',
                    describe: 'Build for node platform',
                    type: 'boolean',
                    default: false
                })
                .option('dev', {
                    alias: 'd',
                    describe: 'Build for development',
                    type: 'boolean',
                    default: false
                })
                .option('serve', {
                    alias: 's',
                    describe: 'Serve the build folder over HTTP',
                    type: 'boolean',
                    default: false
                })
                .option('outdir', {
                    alias: 'o',
                    describe: 'Output directory',
                    type: 'string',
                    default: 'dist'
                })
                .option('declaration', {
                    alias: 'de',
                    describe: 'Add TypeScript declarations',
                    type: 'boolean',
                    default: false
                })
                .option('watch', {
                    alias: 'w',
                    describe: 'Watch for file changes',
                    type: 'boolean',
                    default: false
                })
                .option('config', {
                    alias: 'c',
                    describe: 'Build configuration file (js/ts)',
                    type: 'string',
                    default: 'xbuild.config.ts'
                })
                .option('tsconfig', {
                    alias: 'tc',
                    describe: 'Set TypeScript configuration file to use',
                    type: 'string',
                    default: 'tsconfig.json'
                })
                .option('minify', {
                    alias: 'm',
                    describe: 'Minify the code',
                    type: 'boolean',
                    default: false
                })
                .option('bundle', {
                    alias: 'b',
                    describe: 'Bundle the code',
                    type: 'boolean',
                    default: false
                })
                .option('noTypeChecker', {
                    alias: 'ntc',
                    describe: 'Skip TypeScript type checking',
                    type: 'boolean',
                    default: false
                })
                .option('buildOnError', {
                    alias: 'boe',
                    describe: 'Continue building even if there are TypeScript type errors',
                    type: 'boolean',
                    default: false
                });
        })
        .help()
        .alias('help', 'h');
}
