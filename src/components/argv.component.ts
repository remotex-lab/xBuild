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
import { version } from '../../package.json';

/**
 * ASCII Logo and Version Information
 */

const asciiLogo = `
     ______       _ _     _
     | ___ \\     (_) |   | |
__  _| |_/ /_   _ _| | __| |
\\ \\/ / ___ \\ | | | | |/ _\` |
 >  <| |_/ / |_| | | | (_| |
/_/\\_\\____/ \\__,_|_|_|\\__,_|
`;

// ANSI escape codes for colors
const cleanScreen = '\x1Bc';
const pastelOrange = '\x1b[38;5;214m'; // Light orange color
const pastelPurple = '\x1b[38;5;135m'; // Light purple color
const reset = '\x1b[0m'; // Reset color

const versionInfo = `
${ cleanScreen }
${ pastelOrange }${ asciiLogo }${ reset }
Version: ${ pastelPurple }${ version }${ reset }
`;

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
    const cli =  yargs(hideBin(argv))
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
                console.log(versionInfo);
                process.exit(0);
            }
        });

    // Custom help message with version info at the top
    cli.showHelp((helpText) => {
        if (process.argv.includes('--help') || process.argv.includes('-h')) {
            console.log(versionInfo);
            console.log(helpText + '\n\n');
            process.exit(0); // Ensure the process exits after showing help
        }
    });

    return <Argv<ArgvInterface>> cli;
}
