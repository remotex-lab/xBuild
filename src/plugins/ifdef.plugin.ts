/**
 * Import will remove at compile time
 */

import type { Plugin } from 'esbuild';
import type { DefOptionsInterface } from '@plugins/interfaces/ifdef.interface';

/**
 * Imports
 */

import { resolve } from 'path';
import { promises } from 'fs';

/**
 * Parses and filters content based on conditional directives.
 *
 * This function processes the given code contents and removes sections that
 * are conditionally compiled based on the provided `defines` object.
 *
 * @param contents - The code contents to be processed.
 * @param defines - An object containing conditional
 *   definitions. Keys are condition names, and values are their definitions.
 * @returns The processed code contents with conditional blocks removed
 *   according to the `defines` object.
 */

function parseConditionals(contents: string, defines: Record<string, string>): string {
    return contents.replace(/\/\/\s?ifdef (\w+)[\s\S]*?\/\/\s?endif/g, (match, condition) => {
        // Check if the condition is defined
        return defines[condition] ? match : '';
    });
}

/**
 * Creates an esbuild plugin that handles conditional compilation based on
 * `ifdef` directives.
 *
 * This plugin uses the `ifdef` syntax to conditionally include or exclude
 * code blocks based on the `defines` object provided in the plugin options.
 *
 * @param options - Options for the plugin.
 * @param fileTypes - Optional parameter to specify file types
 * @param options.defines - An object containing
 *   conditional definitions. Keys are condition names, and values are their
 *   definitions.
 * @returns The esbuild plugin object.
 */

export function defPlugin(options: DefOptionsInterface, fileTypes: Array<string> = [ 'js', 'ts' ]): Plugin {
    // Create a regex pattern to match the specified file types
    const fileTypesPattern = new RegExp(`\\.(${fileTypes.join('|')})$`);

    return {
        name: 'if-def',
        setup(build) {
            const defines = options.defines;
            build.onLoad({ filter: fileTypesPattern }, async (args) => {
                const filePath = resolve(args.path);
                let contents = await promises.readFile(filePath, 'utf8');
                // Use the `parseConditionals` function to filter content based on defines
                contents = parseConditionals(contents, defines);

                return { contents, loader: 'ts' };
            });

            build.onEnd((result) => {
                if (result.metafile) {
                    console.log('Module details:');
                    for (const [ path, meta ] of Object.entries(result.metafile.inputs)) {
                        console.log(`Module: ${ path }`);
                        // console.log(`  Entry points: ${ meta.entryPoint ? 'Yes' : 'No' }`);
                        console.log(`  Size: ${ meta.bytes } bytes`);
                    }
                }
            });
        }
    };
}
