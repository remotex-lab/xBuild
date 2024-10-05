#!/usr/bin/env node

/**
 * Exports
 */

export type * from '@configuration/interfaces/configuration.interface';
export type { BuildResult, OnLoadArgs, OnLoadResult, OnResolveArgs, OnResolveResult, PluginBuild } from 'esbuild';

/**
 * Import will remove at compile time
 */

import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { argvParser } from '@services/cli.service';
import { BuildService } from '@services/build.service';
import { VMRuntimeError } from '@errors/vm-runtime.error';
import { bannerComponent } from '@components/banner.component';
import { configuration } from '@providers/configuration.provider';

/**
 * Clean cli
 */

global.__ACTIVE_COLOR = true;
console.log(bannerComponent());

/**
 * Main run
 */

async function run() {
    const cli = argvParser(process.argv);
    const args = <ArgvInterface> cli.argv;

    const config = await configuration(args.config, cli);
    const build = new BuildService(config);

    if (args.typeCheck)
        return build.typeScriptProvider.typeCheck(true);

    if (Array.isArray(args.debug)) {
        if (args.debug.length < 1)
            args.debug = [ 'index' ];

        return await build.runDebug(args.debug);
    }

    if (args.serve) {
        return await build.serve();
    }

    await build.run();
}

/**
 * Run entrypoint of xBuild
 */

run().catch((error: Error | BaseError) => {
    if (error instanceof BaseError)
        return console.log(error.toString());

    console.log((new VMRuntimeError(error)).toString());
});

/**
 * Todo
 * 1. fix select the correct source map
 * 2. support get build format cjs or esm from cli for build esm and cjs same config
 * 3. get outdir form cli smae
 * 4.
 *
 * "module": "./dist/esm/index.js"
 *   "exports": {
 *     "./package.json": "./package.json",
 *     ".": {
 *       "import": {
 *         "types": "./dist/esm/index.d.ts",
 *         "default": "./dist/esm/index.js"
 *       },
 *       "require": {
 *         "types": "./dist/commonjs/index.d.ts",
 *         "default": "./dist/commonjs/index.js"
 *       }
 *     }
 *   },
 * add "type": "module",
 *
 * fix dev filename type to ignore .ts/.js
 */
