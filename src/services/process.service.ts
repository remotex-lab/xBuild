/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Imports
 */

import { spawn as process_spawn } from 'child_process';

/**
 * Spawns a new Node.js process to execute the provided JavaScript file, with optional debugging support.
 *
 * This function creates a new Node.js process to run the specified JavaScript file with source map support enabled.
 * It optionally starts the process in debug mode, which allows WebStorm or other debuggers to attach to the process.
 * The output and error streams of the spawned process are captured and logged to the console.
 *
 * @param filePath - The path to the JavaScript file to execute.
 * @param debug - A boolean flag to enable debugging. If `true`, the process will be started with the `--inspect-brk` option,
 * which opens a debugger on `0.0.0.0:9229`, allowing external debuggers to attach.
 *
 * @returns A `ChildProcessWithoutNullStreams` object representing the spawned process.
 * This object allows interaction with the process, including capturing its output and error streams.
 *
 * @remarks
 * - The `--enable-source-maps` flag is used to enable source map support, which allows better debugging by mapping
 *   errors and stack traces to the original source code.
 * - If `debug` is `true`, the `--inspect-brk=0.0.0.0:9229` flag is added, starting the process in debug mode and pausing
 *   execution until a debugger is attached.
 * - The output (`stdout`) and error (`stderr`) streams of the spawned process are logged to the console.
 * - The function returns a `ChildProcessWithoutNullStreams` object that can be used to interact with the spawned process,
 *   such as handling its termination or sending input.
 *
 * @throws {Error} Throws an error if the Node.js process fails to start or if there are issues with the provided file path.
 *
 * @example
 * ```typescript
 * import { spawn } from '@services/process.service';
 *
 * // Run without debugging
 * const process = spawn('./path/to/script.js', false);
 *
 * process.on('close', (code) => {
 *     console.log(`Process exited with code ${code}`);
 * });
 *
 * // Run with debugging enabled
 * const debugProcess = spawn('./path/to/script.js', true);
 *
 * debugProcess.on('close', (code) => {
 *     console.log(`Debug process exited with code ${code}`);
 * });
 * ```
 *
 * In these examples, the `spawn` function is used to execute a JavaScript file, once in normal mode and once with debugging enabled.
 * The process's exit code is logged when the process completes.
 *
 * @public
 * @category Services
 */

export function spawn(filePath: string, debug: boolean): ChildProcessWithoutNullStreams {
    const args = [ '--enable-source-maps', filePath ];
    if (debug)
        args.unshift('--inspect-brk=0.0.0.0:0');

    const processInstance = process_spawn('node', args);

    // Capture stdout
    processInstance.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    // Capture stderr
    processInstance.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    return processInstance;
}
