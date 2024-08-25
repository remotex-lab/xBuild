#!/usr/bin/env node

/**
 * Import will remove at compile time
 */

import type { ArgvInterface } from '@components/interfaces/argv.interface';

/**
 * Imports
 */

import { argvParser } from '@components/argv.component';
import { errorHandler } from '@providers/error.provider';
import { BuildDirective } from '@directives/build.directive';
import { getConfiguration } from '@components/configuration.component';

/**
 * Clean cli
 */

process.stdout.write('\x1Bc');

/**
 * Main run
 */

async function run() {
    const cli = argvParser(process.argv);
    const args = <ArgvInterface> cli.argv;


    try {
        const config = await getConfiguration(args.config, cli);
        const build = new BuildDirective(config);
        if (args.dev) {
            return await build.dev();
        }

        if(args.serve) {
            return await build.serve();
        }

        await build.run();
    } catch (error) {
        errorHandler(error);
    }
}

run();
