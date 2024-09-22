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
