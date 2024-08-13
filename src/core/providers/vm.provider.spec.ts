/**
 * Import will remove at compile time
 */

import type { Context } from 'vm';

/**
 * Imports
 */

import { sandboxExecute } from '@providers/vm.provider';

describe('sandboxExecute', () => {
    test('should execute simple JavaScript code', () => {
        const code = 'const x = 5; x + 10;';
        const result = sandboxExecute(code);
        expect(result).toBe(15);
    });

    test('should use variables from the sandbox', () => {
        const code = 'x + y';
        const sandbox: Context = { x: 5, y: 10 };
        const result = sandboxExecute(code, sandbox);
        expect(result).toBe(15);
    });

    test('should modify sandbox variables', () => {
        const code = 'x += 10; y *= 2; z = x + y;';
        const sandbox: Context = { x: 5, y: 3 };
        sandboxExecute(code, sandbox);
        expect(sandbox.x).toBe(15);
        expect(sandbox.y).toBe(6);
        expect(sandbox.z).toBe(21);
    });

    test('should throw an error for invalid code', () => {
        const code = 'throw new Error("Test error");';
        expect(() => sandboxExecute(code)).toThrow('Test error');
    });

    test('should not access variables outside the sandbox', () => {
        const code = 'typeof process !== "undefined"';
        const result = sandboxExecute(code);
        expect(result).toBe(false);
    });

    test('should allow functions in the sandbox', () => {
        const code = 'sayHello("World")';
        const sandbox: Context = {
            sayHello: (name: string) => `Hello, ${ name }!`
        };
        const result = sandboxExecute(code, sandbox);
        expect(result).toBe('Hello, World!');
    });
});
