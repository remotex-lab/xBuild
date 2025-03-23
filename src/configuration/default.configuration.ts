/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { cwd } from 'process';

/**
 * The default configuration options for the build.
 *
 * @example
 * ```ts
 * import { defaultConfiguration } from '@configuration/default-configuration';
 *
 * console.log(defaultConfiguration);
 * ```
 *
 * In this example, the `defaultConfiguration` is imported and logged to the console to view the default settings.
 *
 * @public
 * @category Configuration
 */

export const defaultConfiguration: ConfigurationInterface = {
    dev: false,
    watch: false,
    declaration: false,
    buildOnError: false,
    noTypeChecker: false,
    bundleDeclaration: false,
    define: {},
    esbuild: {
        write: true,
        bundle: true,
        minify: true,
        format: 'cjs',
        outdir: 'dist',
        platform: 'browser',
        absWorkingDir: cwd(),
        loader: {
            '.js': 'ts'
        }
    },
    serve: {
        port: 3000,
        host: 'localhost',
        active: false
    }
};
