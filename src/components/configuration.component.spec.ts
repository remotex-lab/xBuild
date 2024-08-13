/**
 * Import will remove at compile time
 */

import type { Argv } from 'yargs';
import type { ConfigurationInterface } from '@components/interfaces/configuration.interface';

/**
 * Imports
 */

import { existsSync } from 'fs';
import { sandboxExecute } from '@providers/vm.provider';
import { transpileFile } from '@core/services/transpiler.service';
import { getConfiguration, parseConfigurationFile, defaultConfiguration } from '@components/configuration.component';

jest.mock('fs');
jest.mock('@providers/vm.provider');
jest.mock('@core/services/transpiler.service');

describe('getConfiguration', () => {
    const mockCli = {
        argv: {
            dev: true,
            watch: true,
            declaration: true,
            bundle: true,
            minify: true,
            outdir: 'dist',
            tsconfig: 'tsconfig.json',
            file: 'src/index.ts',
            serve: true
        }
    } as unknown as Argv<any>;

    beforeEach(() => {
        jest.resetAllMocks();
    });

    test('should return the default configuration when the config file does not exist', async () => {
        (existsSync as jest.Mock).mockReturnValue(false);

        const config = await getConfiguration('nonexistent.config.js', mockCli);

        expect(config).toEqual({
            ...defaultConfiguration,
            dev: true,
            watch: true,
            declaration: true,
            esbuild: {
                ...defaultConfiguration.esbuild,
                bundle: true,
                minify: true,
                outdir: 'dist',
                tsconfig: 'tsconfig.json',
                entryPoints: [ 'src/index.ts' ]
            },
            serve: {
                ...defaultConfiguration.serve,
                active: true
            }
        });
    });

    test('should merge the parsed configuration with the default configuration when the config file exists', async () => {
        (existsSync as jest.Mock).mockReturnValue(true);
        const parsedConfig: Partial<ConfigurationInterface> = {
            dev: false,
            watch: true,
            esbuild: {
                outdir: 'custom-dist'
            }
        };

        (transpileFile as jest.Mock).mockResolvedValue({ code: 'test' });
        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = parsedConfig;
        });

        const config = await getConfiguration('existing.config.js', mockCli);
        expect(config).toEqual({
            ...defaultConfiguration,
            dev: false,
            watch: true,
            declaration: true,
            esbuild: {
                ...defaultConfiguration.esbuild,
                bundle: true,
                minify: true,
                outdir: 'custom-dist',
                tsconfig: 'tsconfig.json',
                entryPoints: [ 'src/index.ts' ]
            },
            serve: {
                ...defaultConfiguration.serve,
                active: true
            }
        });
    });

    test('should throw an error if entryPoints is undefined in the final configuration', async () => {
        (existsSync as jest.Mock).mockReturnValue(true);
        (transpileFile as jest.Mock).mockResolvedValue({ code: 'test' });
        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = {
                esbuild: {
                    entryPoints: undefined
                }
            };
        });

        await expect(getConfiguration('existing.config.js', mockCli)).rejects.toThrow('entryPoints cannot be undefined.');
    });
});

describe('parseConfigurationFile', () => {
    test('should transpile the configuration file and return the parsed configuration object', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: 'transpiledCode' });

        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = { dev: true, watch: true };
        });

        const config = await parseConfigurationFile('valid.config.ts');

        expect(transpileFile).toHaveBeenCalledWith('valid.config.ts', expect.any(Object));
        expect(config).toEqual({ dev: true, watch: true });
    });

    test('should return the default configuration when the sandbox does not modify exports', async () => {
        (transpileFile as jest.Mock).mockResolvedValue({ code: 'transpiledCode' });
        (sandboxExecute as jest.Mock).mockImplementation((code: string, context: any) => {
            context.module.exports.default = {};
        });

        const config = await parseConfigurationFile('empty.config.ts');

        expect(config).toEqual({});
    });
});
