/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Imports
 */

import { spawn as process_spawn } from 'child_process';

/**
 * Spawns a new Node.js process to execute the provided JavaScript file.
 *
 * This function creates a new Node.js process to run the specified JavaScript file with source map support enabled.
 * It captures and logs the output and error streams of the spawned process.
 *
 * @param filePath - The path to the JavaScript file to execute.
 *
 * @returns A `ChildProcessWithoutNullStreams` object representing the spawned process.
 * This object allows interaction with the process, including capturing its output and error streams.
 *
 * @remarks
 * - The `--enable-source-maps` flag is used to enable source map support, which allows better debugging by mapping
 *   errors and stack traces to the original source code.
 * - The output and error streams of the spawned process are logged to the console.
 * - The function returns a `ChildProcessWithoutNullStreams` object that can be used to interact with the spawned process,
 *   such as handling its termination or sending input.
 *
 * @throws {Error} Throws an error if the Node.js process fails to start or if there are issues with the provided file path.
 *
 * @example
 * ```typescript
 * import { spawn } from '@services/process.service';
 *
 * const process = spawn('./path/to/script.js');
 *
 * process.on('close', (code) => {
 *     console.log(`Process exited with code ${code}`);
 * });
 * ```
 *
 * In this example, the `spawn` function is used to execute a JavaScript file. The process's exit code is logged when the process completes.
 *
 * @public
 * @category Services
 */

export function spawn(filePath: string): ChildProcessWithoutNullStreams {
    const processInstance = process_spawn('node', [ '--enable-source-maps', filePath ]);

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
