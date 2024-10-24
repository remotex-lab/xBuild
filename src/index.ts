#!/usr/bin/env node

/**
 * Exports
 */

export type * from '@configuration/interfaces/configuration.interface';
export type { BuildResult, OnLoadArgs, OnLoadResult, OnResolveArgs, OnResolveResult, PluginBuild } from 'esbuild';

/**
 * Import will remove at compile time
 */

import type { xBuildError } from '@errors/xbuild.error';
import type { VMRuntimeError } from '@errors/vm-runtime.error';
import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

import '@errors/stack.error';
import '@errors/uncaught.error';
import { argvParser } from '@services/cli.service';
import { BuildService } from '@services/build.service';
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
    const configs = await configuration(args.config, cli);
    const buildPromises = configs.map(async (config): Promise<void> => {
        const build = new BuildService(config);
        if (args.typeCheck)
            return build.typeScriptProvider.typeCheck(true);

        if (args.serve || config.serve.active)
            return await build.serve();

        if (Array.isArray(args.debug)) {
            if (args.debug.length < 1) {
                args.debug = [ 'index' ];
            }

            return await build.runDebug(args.debug);
        }

        await build.run();
    });

    // Wait for all build promises to resolve
    await Promise.all(buildPromises);
}

/**
 * Run entrypoint of xBuild
 */

run().catch((error: VMRuntimeError & xBuildError) => {
    console.error(error.stack);
});
