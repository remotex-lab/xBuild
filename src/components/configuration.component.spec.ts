/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ArgvInterface } from '@components/interfaces/argv.interface';
import type { ConfigurationInterface, xBuildConfig } from '@providers/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync, readFileSync } from 'fs';
import { getConfiguration, getTsConfiguration } from '@components/configuration.component';
import { parseConfigurationFile, setCliConfiguration } from '@providers/configuration.provider';
import {
    sys,
    ScriptTarget,
    DiagnosticCategory,
    parseConfigFileTextToJson,
    parseJsonConfigFileContent
} from 'typescript';

/**
 * Mocks
 */

jest.mock('fs');
jest.mock('@providers/configuration.provider');
jest.mock('typescript', () => ({
    ...jest.requireActual('typescript'),
    parseConfigFileTextToJson: jest.fn(),
    parseJsonConfigFileContent: jest.fn()
}));

/**
 * Test suite for the `getConfiguration` function.
 *
 * The `getConfiguration` function merges default configurations with user-provided configurations.
 * It prioritizes the user-provided configurations and ensures all required properties are set.
 */

describe('getConfiguration', () => {
    const mockCli = {} as Argv<ArgvInterface>;
    const mockConfig: xBuildConfig = {
        esbuild: {
            entryPoints: [ 'src/index.ts' ]
        },
        serve: {
            port: 3000
        }
    };

    /**
     * Setup mocks before each test.
     *
     * Mocks the `setCliConfiguration` function to return the default configuration.
     */

    beforeEach(() => {
        (setCliConfiguration as jest.Mock).mockReturnValue(mockConfig);
    });

    /**
     * Reset mocks after each test.
     *
     * Ensures that each test starts with a fresh state by resetting all mocked functions.
     */

    afterEach(() => {
        jest.resetAllMocks();
    });

    /**
     * Test case: should return default configuration when no user config file exists.
     *
     * Mocks the `existsSync` function to simulate the absence of a user configuration file.
     * Verifies that the default configuration is returned.
     */

    test('should return default configuration when no user config file exists', async () => {
        (existsSync as jest.Mock).mockReturnValue(false);

        const config = await getConfiguration('non-existent.config.ts', mockCli);

        expect(setCliConfiguration).toHaveBeenCalledWith(mockCli);
        expect(config).toEqual(mockConfig);
    });

    /**
     * Test case: should merge user config file with default config.
     *
     * Mocks the `existsSync` function to simulate the presence of a user configuration file.
     * Mocks the `parseConfigurationFile` function to return user-specific configurations.
     * Verifies that the resulting configuration is a merge of default and user configurations.
     */

    test('should merge user config file with default config', async () => {
        (existsSync as jest.Mock).mockReturnValue(true);
        const userConfig: xBuildConfig = {
            esbuild: {
                entryPoints: [ 'src/main.ts' ],
                minify: true
            },
            serve: {
                port: 4000
            }
        };
        (parseConfigurationFile as jest.Mock).mockResolvedValue(userConfig);

        const config = await getConfiguration('user.config.ts', mockCli);

        expect(parseConfigurationFile).toHaveBeenCalledWith('user.config.ts');
        expect(config).toEqual({
            esbuild: {
                entryPoints: [ 'src/main.ts' ],
                minify: true
            },
            serve: {
                port: 4000
            }
        });
    });

    /**
     * Test case: should throw an error if entryPoints is undefined.
     *
     * Mocks the `existsSync` function to simulate the presence of a user configuration file.
     * Mocks the `parseConfigurationFile` function to return a configuration with `entryPoints` undefined.
     * Verifies that the function throws an error due to missing required `entryPoints`.
     */

    test('should throw an error if entryPoints is undefined', async () => {
        (existsSync as jest.Mock).mockReturnValue(true);
        const userConfig: Partial<ConfigurationInterface> = {
            esbuild: {
                entryPoints: undefined
            }
        };
        (parseConfigurationFile as jest.Mock).mockResolvedValue(userConfig);

        await expect(getConfiguration('user.config.ts', mockCli)).rejects.toThrow(
            'entryPoints cannot be undefined.'
        );
    });

    /**
     * Test case: should use default config if user config file is empty.
     *
     * Mocks the `existsSync` function to simulate the presence of a user configuration file.
     * Mocks the `parseConfigurationFile` function to return an empty configuration.
     * Verifies that the function falls back to the default configuration.
     */

    test('should use default config if user config file is empty', async () => {
        (existsSync as jest.Mock).mockReturnValue(true);
        (parseConfigurationFile as jest.Mock).mockResolvedValue({});

        const config = await getConfiguration('empty.config.ts', mockCli);

        expect(setCliConfiguration).toHaveBeenCalledWith(mockCli);
        expect(config).toEqual(mockConfig);
    });
});


describe('getTsConfiguration', () => {
    const tsConfigPath = '/path/to/tsconfig.json';
    const mockTsConfigContent = JSON.stringify({
        compilerOptions: {
            target: 'ES2020',
            module: 'commonjs'
        }
    });
    const mockParsedConfigFileJson = {
        config: {
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs'
            }
        }
    };

    beforeEach(() => {
        (readFileSync as jest.Mock).mockReturnValue(mockTsConfigContent);
        (parseConfigFileTextToJson as jest.Mock).mockReturnValue(mockParsedConfigFileJson);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should correctly parse the tsconfig file and return a valid ParsedCommandLine', () => {
        const mockParsedCommandLine = { options: { target: ScriptTarget.ES2020 }, errors: [] };
        (parseJsonConfigFileContent as jest.Mock).mockReturnValue(mockParsedCommandLine);

        const result = getTsConfiguration(tsConfigPath);
        expect(readFileSync).toHaveBeenCalledWith(tsConfigPath, 'utf8');
        expect(parseConfigFileTextToJson).toHaveBeenCalledWith(tsConfigPath, mockTsConfigContent);
        expect(parseJsonConfigFileContent).toHaveBeenCalledWith(
            mockParsedConfigFileJson.config,
            sys,
            expect.any(String)
        );
        expect(result).toEqual(mockParsedCommandLine);
    });

    test('should throw an error if there is a syntax error in the tsconfig.json', () => {
        (readFileSync as jest.Mock).mockReturnValue(mockTsConfigContent);
        (parseConfigFileTextToJson as jest.Mock).mockReturnValue({
            error: {
                messageText: 'Mocked compiler error',
                category: DiagnosticCategory.Error,
                code: 1006, // Example error code
                file: undefined
            }
        });

        expect(() => getTsConfiguration(tsConfigPath)).toThrow('Mocked compiler error');
    });

    test('should throw an error if the TypeScript config contains errors', () => {
        (parseJsonConfigFileContent as jest.Mock).mockReturnValue({
            errors: [{
                messageText: 'Mocked compiler error',
                category: DiagnosticCategory.Error,
                code: 1006, // Example error code
                file: undefined
            }]
        });

        expect(() => getTsConfiguration(tsConfigPath)).toThrow('Mocked compiler error');
    });
});
