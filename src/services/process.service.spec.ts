/**
 * Import will remove at compile time
 */

import type { ChildProcessWithoutNullStreams } from 'child_process';

/**
 * Imports
 */

import * as child_process from 'child_process';
import { spawn } from '@services/process.service';

/**
 * Mock the `child_process.spawn` function to control and simulate its behavior.
 * This mock allows testing of the `spawn` function without actually spawning a new Node.js process.
 */

jest.mock('child_process', () => ({
    spawn: jest.fn()
}));

/**
 * Tests for the `spawn` function.
 *
 * The `spawn` function is designed to spawn a new Node.js process that executes the provided JavaScript file.
 * It captures and logs the output and error streams of the spawned process.
 */

describe('spawn', () => {
    let logSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;
    let mockProcess: ChildProcessWithoutNullStreams;

    beforeEach(() => {
        // Create a mock ChildProcessWithoutNullStreams object
        mockProcess = <any> {
            stdout: {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('Mock output'));
                    }
                })
            },
            stderr: {
                on: jest.fn((event, callback) => {
                    if (event === 'data') {
                        callback(Buffer.from('Mock error'));
                    }
                })
            },
            on: jest.fn()
        };

        // Mock the implementation of the spawn function
        (child_process.spawn as jest.Mock).mockReturnValue(mockProcess);

        // Spy on console.log and console.error
        logSpy = jest.spyOn(console, 'log').mockImplementation();
        errorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        // Clean up spies
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    /**
     * Test case to verify that `spawn` correctly spawns a Node.js process with the provided file path.
     *
     * The function should call `child_process.spawn` with the correct arguments and return the mocked process object.
     *
     * Code:
     * ```typescript
     * const filePath = './path/to/script.js';
     * const processInstance = spawn(filePath);
     * ```
     * Expected result: The `child_process.spawn` function is called with 'node', ['--enable-source-maps', filePath], and the returned process instance matches the mock.
     */

    test('should spawn a new Node.js process with the correct arguments', () => {
        const filePath = './path/to/script.js';
        const processInstance = spawn(filePath);

        // Verify that console.log and console.error are called with expected values
        expect(logSpy).toHaveBeenCalledWith('Mock output');
        expect(errorSpy).toHaveBeenCalledWith('Mock error');

        expect(child_process.spawn).toHaveBeenCalledWith('node', [ '--enable-source-maps', filePath ]);
        expect(processInstance).toBe(mockProcess);
    });

    /**
     * Test case to ensure that `spawn` logs stdout and stderr data correctly.
     *
     * The `spawn` function should log output and error messages to the console as expected.
     *
     * Code:
     * ```typescript
     * const logSpy = jest.spyOn(console, 'log').mockImplementation();
     * const errorSpy = jest.spyOn(console, 'error').mockImplementation();
     * spawn('./path/to/script.js');
     * ```
     * Expected result: `console.log` is called with 'Mock output' and `console.error` is called with 'Mock error'.
     */

    test('should log stdout and stderr data', () => {
        spawn('./path/to/script.js');

        // Verify that console.log and console.error are called with expected values
        expect(logSpy).toHaveBeenCalledWith('Mock output');
        expect(errorSpy).toHaveBeenCalledWith('Mock error');

        // Clean up spies
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    /**
     * Test case to verify that `spawn` returns the `ChildProcessWithoutNullStreams` object.
     *
     * The function should return the mocked process object so that it can be used to interact with the spawned process.
     *
     * Code:
     * ```typescript
     * const processInstance = spawn('./path/to/script.js');
     * ```
     * Expected result: The returned process instance matches the mock process object.
     */

    test('should return the ChildProcessWithoutNullStreams object', () => {
        const filePath = './path/to/script.js';
        const processInstance = spawn(filePath);

        // Verify that console.log and console.error are called with expected values
        expect(logSpy).toHaveBeenCalledWith('Mock output');
        expect(errorSpy).toHaveBeenCalledWith('Mock error');

        expect(processInstance).toBe(mockProcess);
    });
});
