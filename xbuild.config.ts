/**
 * Import will remove at compile time
 */

import type { OnLoadArgs } from 'esbuild';
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
    define: {
        __VERSION: pkg.version
    },
    esbuild: {
        bundle: true,
        minify: true,
        format: 'esm',
        target: [ `node${ version.slice(1) }` ],
        platform: 'node',
        packages: 'external',
        sourcemap: true,
        sourceRoot: `https://github.com/remotex-lab/xBuild/tree/v${ pkg.version }/`,
        entryPoints: {
            index: 'src/index.ts'
        }
    },
    hooks: {
        onLoad: (content: string | Uint8Array, loader: string | undefined, args: OnLoadArgs) => {
            if (!/.css|.html/.test(args.path)) {
                return;
            }

            return {
                loader: 'text',
                contents: content
            };
        }
    }
};

export default config;
