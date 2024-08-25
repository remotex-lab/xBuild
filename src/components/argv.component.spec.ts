/**
 * Imports
 */

import { argvParser } from '@components/argv.component';

/**
 * Mock version for testing
 */

const mockVersion = '1.0.0';

// Mock the package.json module to return the mockVersion
jest.mock('../../package.json', () => ({
    version: '1.0.0'
}));

describe('argvParser', () => {
    beforeEach(() => {
        // Reset mocks before each test
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    /**
     * Test parsing of command-line arguments
     */

    test('should parse command-line arguments correctly', () => {
        // Mock process.argv
        const argv = [
            'node',
            'script.js',
            'inputFile.ts',
            '--dev',
            '--outdir',
            'build',
            '--tsconfig',
            'custom.tsconfig.json'
        ];

        const parsedArgs = <any>argvParser(argv);

        // Expect the parsed arguments to match the provided command-line arguments
        expect(parsedArgs.argv.file).toEqual('inputFile.ts');
        expect(parsedArgs.argv.dev).toBe(true);
        expect(parsedArgs.argv.outdir).toBe('build');
        expect(parsedArgs.argv.tsconfig).toBe('custom.tsconfig.json');
    });

    /**
     * Test displaying help message and exiting
     */

    test('should display help and exit when --help is passed', () => {
        // Mock console.log and process.exit
        console.log = jest.fn();
        process.exit = <any>jest.fn();

        process.argv = [
            'node',
            'script.js',
            '--help'
        ];

        argvParser(process.argv);
        expect(console.log).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(0);
    });

    /**
     * Test showing version information and exiting
     */

    test('should show version info and exit when --version is passed', () => {


        // Mock console.log and process.exit
        console.log = jest.fn();
        process.exit = <any>jest.fn();

        const argv = [
            'node',
            'script.js',
            '--version'
        ];

        argvParser(argv);

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining(mockVersion));
        expect(process.exit).toHaveBeenCalledWith(0);
    });
});
