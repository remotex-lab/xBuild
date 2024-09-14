/**
 * Import will remove at compile time
 */

import type { xBuildConfig } from '@remotex-labs/xbuild';

/**
 * Imports
 */

import { version } from 'process';
import pkg from './package.json' with { type: 'json' };

/**
 * Config build
 */

const config: xBuildConfig = {
    declaration: true,
    esbuild: {
        bundle: true,
        minify: true,
        target: [ `node${ version.slice(1) }` ],
        platform: 'node',
        packages: 'external',
        sourcemap: true,
        sourceRoot: 'https://github.com/remotex-lab/xBuild/tree/master/',
        entryPoints: {
            index: 'src/index.ts'
        },
        define: {
            __VERSION: JSON.stringify(pkg.version)
        }
    }
};

export default config;
