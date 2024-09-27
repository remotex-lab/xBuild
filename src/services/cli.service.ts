/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { bannerComponent } from '@components/banner.component';

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
    const cli = yargs(hideBin(argv))
        .command('$0 [file]', 'A versatile JavaScript and TypeScript toolchain build system.', (yargs) => {
            yargs
                .positional('entryPoints', {
                    describe: 'The file entryPoints to build',
                    type: 'string'
                })
                .option('typeCheck', {
                    describe: 'Perform type checking',
                    alias: 'tc',
                    type: 'boolean',
                    default: false
                })
                .option('node', {
                    alias: 'n',
                    describe: 'Build for node platform',
                    type: 'boolean',
                    default: false
                })
                .option('dev', {
                    alias: 'd',
                    describe: 'Array entryPoints to run as development in Node.js',
                    type: 'array'
                })
                .option('debug', {
                    alias: 'db',
                    describe: 'Array entryPoints to run in Node.js with debug state',
                    type: 'array'
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
                    alias: 'tsc',
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
                })
                .option('version', {
                    alias: 'v',
                    describe: 'Show version number',
                    type: 'boolean',
                    default: false,
                    conflicts: 'help'
                });
        })
        .help()
        .alias('help', 'h')
        .version(false) // Disable the default version behavior
        .middleware((argv) => {
            if (argv.version) {
                console.log(bannerComponent());
                process.exit(0);
            }
        });

    // Custom help message with version info at the top
    cli.showHelp((helpText) => {
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            console.log(bannerComponent());
            console.log(helpText + '\n\n');
            process.exit(0); // Ensure the process exits after showing help
        }
    });

    return <Argv<ArgvInterface>> cli;
}
