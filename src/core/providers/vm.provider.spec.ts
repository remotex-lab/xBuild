/**
 * Import will remove at compile time
 */

import type { Context } from 'vm';

/**
 * Imports
 */

import { sandboxExecute } from '@providers/vm.provider';

/**
 * Tests for the `sandboxExecute` function.
 *
 * The `sandboxExecute` function is designed to execute JavaScript code in a sandboxed environment,
 * allowing for controlled execution of code and interaction with the sandbox's variables.
 *
 * Each test case below validates a specific behavior of `sandboxExecute`.
 */

describe('sandboxExecute', () => {

    /**
     * Test case to verify that simple JavaScript code executes correctly.
     *
     * Code: `const x = 5; x + 10;`
     * Expected result: `15`
     */

    test('should execute simple JavaScript code', () => {
        const code = 'const x = 5; x + 10;';
        const result = sandboxExecute(code);
        expect(result).toBe(15);
    });

    /**
     * Test case to ensure that variables from the sandbox can be used in the executed code.
     *
     * Code: `x + y`
     * Sandbox variables: `{ x: 5, y: 10 }`
     * Expected result: `15`
     */

    test('should use variables from the sandbox', () => {
        const code = 'x + y';
        const sandbox: Context = { x: 5, y: 10 };
        const result = sandboxExecute(code, sandbox);
        expect(result).toBe(15);
    });

    /**
     * Test case to validate that the sandbox variables can be modified by the executed code.
     *
     * Code: `x += 10; y *= 2; z = x + y;`
     * Initial sandbox variables: `{ x: 5, y: 3 }`
     * Expected updated sandbox variables: `{ x: 15, y: 6, z: 21 }`
     */

    test('should modify sandbox variables', () => {
        const code = 'x += 10; y *= 2; z = x + y;';
        const sandbox: Context = { x: 5, y: 3 };
        sandboxExecute(code, sandbox);
        expect(sandbox.x).toBe(15);
        expect(sandbox.y).toBe(6);
        expect(sandbox.z).toBe(21);
    });

    /**
     * Test case to ensure that the function throws an error for invalid code.
     *
     * Code: `throw new Error("Test error");`
     * Expected error: `'Test error'`
     */

    test('should throw an error for invalid code', () => {
        const code = 'throw new Error("Test error");';
        expect(() => sandboxExecute(code)).toThrow('Test error');
    });

    /**
     * Test case to verify that the sandboxed code cannot access variables outside the sandbox.
     *
     * Code: `typeof process !== "undefined"`
     * Expected result: `false`
     */

    test('should not access variables outside the sandbox', () => {
        const code = 'typeof process !== "undefined"';
        const result = sandboxExecute(code);
        expect(result).toBe(false);
    });

    /**
     * Test case to check if functions defined in the sandbox can be used in the executed code.
     *
     * Code: `sayHello("World")`
     * Sandbox functions: `{ sayHello: (name: string) => `Hello, ${ name }!` }`
     * Expected result: `'Hello, World!'`
     */

    test('should allow functions in the sandbox', () => {
        const code = 'sayHello("World")';
        const sandbox: Context = {
            sayHello: (name: string) => `Hello, ${ name }!`
        };
        const result = sandboxExecute(code, sandbox);
        expect(result).toBe('Hello, World!');
    });
});
