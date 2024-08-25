/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams} from 'child_process';

/**
 * Imports
 */

import { spawn as process_spawn } from 'child_process';

/**
 * Spawns a new Node.js process that executes the provided JavaScript code string.
 *
 * This function creates a child process using the `node` command and runs the provided code via the `-e` flag.
 * The function listens to and logs the `stdout` and `stderr` streams from the process, and logs its exit status.
 *
 * @param filePath - The JavaScript code to be executed in the spawned Node.js process.
 *
 * @returns {ChildProcessWithoutNullStreams} The spawned Node.js process instance.
 *
 * @example
 * const processInstance = spawn('console.log("Hello from child process")');
 *
 * // Output on stdout: Hello from child process
 *
 * @event stdout - Captures the standard output of the child process and logs it.
 * @event stderr - Captures the standard error output of the child process and logs it.
 * @event exit - Logs the process exit code and signal when the child process exits.
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

    // Handle process exit
    processInstance.on('exit', (code, signal) => {
        console.log(`Process exited with code: ${code}, signal: ${signal}`);
    });

    return processInstance;
}
