/**
 * Import will remove at compile time
 */

import type { Context } from 'vm';

/**
 * Imports
 */

import { Script, createContext } from 'vm';

/**
 * Executes the provided JavaScript code within a sandboxed context.
 *
 * @param code - The JavaScript code to execute.
 * @param sandbox - The sandbox object to provide global variables and functions.
 * @returns The result of the executed code.
 * @throws Error - Throws an error if the code execution fails.
 */

export function sandboxExecute(code: string, sandbox: Context = {}) {
    const script = new Script(code);
    const context = createContext(sandbox);

    return script.runInContext(context, { breakOnSigint: true });
}
