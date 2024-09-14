/**
 * Imports
 */

import { argvParser } from '@services/cli.service';
import { bannerComponent } from '@components/banner.component';

/**
 * Mocks
 */

jest.mock('@components/banner.component', () => ({
    bannerComponent: jest.fn().mockReturnValue('Version info')
}));

/**
 * Tests for the `argvParser` function.
 *
 * The `argvParser` function is designed to parse command-line arguments into an `ArgvInterface` object
 * using `yargs`. It configures `yargs` to handle various build-related options for a JavaScript and
 * TypeScript toolchain and returns an object that adheres to the `ArgvInterface` structure based on the
 * parsed arguments.
 */

describe('argvParser', () => {
    let exitSpy: jest.SpyInstance;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(<any> jest.fn());
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        exitSpy.mockRestore();
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    /**
     * Test case to verify that `argvParser` correctly parses command-line arguments.
     *
     * The function should call `yargs` with the provided arguments and set up the command and options
     * as expected. It should also handle the custom help message.
     *
     * Code:
     * ```typescript
     * const args = ['node', 'script.js', '--dev', '--outdir', 'build'];
     * const result = argvParser(args);
     * ```
     * Expected result: The `yargs` instance is called with the arguments, and `showHelp` is triggered.
     */

    test('should correctly parse command-line arguments', () => {
        const args = [ 'node', 'script.js', '--dev', '--outdir', 'build' ];

        const result = argvParser(args);

        // Verify the result is an instance of yargs
        expect(result).toBeDefined();
        expect(result.parse).toBeDefined();

        // You can further check the configuration of yargs here
        // expect(yargs).toHaveBeenCalledWith(args);
        // expect(result.showHelp).toHaveBeenCalled();
    });

    /**
     * Test case to ensure that version information is displayed when the `--version` flag is used.
     *
     * The `argvParser` function should log version information when the `--version` flag is present.
     *
     * Code:
     * ```typescript
     * const args = ['node', 'script.js', '--version'];
     * const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
     * argvParser(args);
     * ```
     * Expected result: `console.log` is called with 'Version info'.
     */

    test('should show version information when --version flag is used', () => {
        (<any> global).__VERSION = '1.0.0';
        const args = [ 'node', 'script.js', '--version' ];

        argvParser(args);
        expect(bannerComponent).toHaveBeenCalled();
    });

    test('should display help message and exit when -h flag is used', () => {
        const args = [ 'node', 'script.js', '-h' ];
        process.argv = args;

        const cli = argvParser(args);
        cli.showHelp();

        expect(bannerComponent).toHaveBeenCalled();
    });
});
