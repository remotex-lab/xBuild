/**
 * Import will remove at compile time
 */

import type { ConfigurationInterface } from '@configuration/interfaces/configuration.interface';

/**
 * Imports
 */

import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

/**
 * Generates a `package.json` file with the appropriate `type` field
 * based on the format specified in the configuration.
 *
 * - If the format is `esm`, the `type` will be set to `"module"`.
 * - If the format is `cjs`, the `type` will be set to `"commonjs"`.
 *
 * The function will ensure that the output directory exists, and if it doesn't,
 * it will create the necessary directories before writing the `package.json` file.
 *
 * @param {ConfigurationInterface} config - The build configuration object containing
 * esbuild-related settings, such as the output directory (`outdir`) and format (`format`).
 *
 * - `config.esbuild.outdir`: The output directory where the `package.json` will be created.
 * - `config.esbuild.format`: The module format, either `'esm'` or `'cjs'`, that determines the `type` field.
 *
 * @throws Will throw an error if there is a problem creating the directory or writing the file.
 *
 * Example usage:
 *
 * ```ts
 * const config = {
 *   esbuild: {
 *     outdir: 'dist',
 *     format: 'esm'
 *   }
 * };
 * packageTypeComponents(config);
 * // This will create 'dist/package.json' with the content: {"type": "module"}
 * ```
 */

export function packageTypeComponents(config: ConfigurationInterface): void {
    const outDir = config.esbuild.outdir ?? '';
    const type = config.esbuild.format === 'esm' ? 'module' : 'commonjs';

    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'package.json'), `{"type": "${type}"}`);
}
