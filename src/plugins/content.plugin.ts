/**
 * Import will remove at compile time
 */

import type { Plugin, PluginBuild } from 'esbuild';
import type { TypescriptDirective } from '@directives/typescript.directive';

/**
 * Imports
 */

import { cwd } from 'process';
import { promises } from 'fs';
import { dirname, extname, relative, resolve } from 'path';


export function contentPlugin(tsconfig: TypescriptDirective, dist: string, esm: boolean = false): Plugin {
    const outDir = relative(cwd(), dist);
    const rootDir = relative(cwd(), tsconfig.tsConfig.options.rootDir ?? '.');

    return {
        name: 'content-parser',
        setup(build: PluginBuild): void {
            build.onLoad({ filter: /js|ts/ }, async (args) => {
                const filePath = resolve(args.path);
                let contents = await promises.readFile(filePath, 'utf8');

                if (esm) {
                    const aliases =  tsconfig.alias;
                    const fileDir = dirname(args.path).replace(rootDir, outDir);
                    for (const alias in aliases) {
                        const relativePath = relative(fileDir, aliases[alias]).replace(/\\/g, '/');
                        const path = relativePath.startsWith('..') ? relativePath : `./${ relativePath }`;
                        contents = contents.replaceAll(alias, path);
                    }

                    // Regular expression to match import/export statements
                    const importExportRegex = /((import|export)\s.*?['"])([^'"]+)(['"])/g;

                    // Modify the file content to add .js extension to imports/exports that are missing it
                    contents = contents.replace(importExportRegex, (match: string, p1: string, p2: string, p3: string, p4: string) => {
                        const ext = extname(p3);
                        // Only add .js if there's no extension
                        if (!ext) {
                            return `${p1}${p3}.js${p4}`;
                        }

                        return match;
                    });
                }

                return { contents, loader: 'ts' };
            });
        }
    };
}
