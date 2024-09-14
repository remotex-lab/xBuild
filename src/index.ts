#!/usr/bin/env node

/**
 * Exports
 */

export * from '@configuration/interfaces/configuration.interface';

/**
 * Import will remove at compile time
 */

import type { BaseError } from '@errors/base.error';
import type { ArgvInterface } from '@services/interfaces/cli.interface';

/**
 * Imports
 */

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
    try {
        const cli = argvParser(process.argv);
        const args = <ArgvInterface> cli.argv;

        const config = await configuration(args.config, cli);
        const build = new BuildService(config);

        if(args.serve) {
            return await build.serve();
        }

        await build.run();
    } catch (error) {
        console.log((<BaseError> error).toString());
    }
}

run();
