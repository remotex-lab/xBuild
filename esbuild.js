/**
 * Imports
 */

import { build } from 'esbuild';
import pkg from './package.json' with  { type: 'json' };

/**
 * Create an array of external dependencies from package.json
 */

const externals = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
];

/**
 * Check for the --sourcemap flag
 */

const args = process.argv.slice(2);
const enableSourcemap = args.includes('--sourcemap');

/**
 * Builds the project using esbuild.
 *
 * This configuration bundles the code, minifies it, and outputs it to the "dist" directory.
 * It targets ES2022 for compatibility and uses CommonJS modules.
 */

build({
    bundle: true,
    minify: false,
    format: 'esm',
    outdir: 'dist',
    target: [ `node${ process.version.slice(1) }` ],
    platform: 'node',
    external: externals,
    sourcemap: enableSourcemap,
    loader: {
        ".node": "ts"
    },
    entryPoints: [
        'src/index.ts'
    ],
}).catch(() => process.exit(1));
