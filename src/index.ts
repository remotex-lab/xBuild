#!/usr/bin/env node

/**
 * Export types
 */

import type { ArgvInterface } from '@components/interfaces/argv.interface';

export type * from '@components/interfaces/configuration.interface';

/**
 * Imports
 */

import { argvParser } from '@components/argv.component';
import { getConfiguration } from '@components/configuration.component';
import { BuildDirective } from './directives/build.directive';

/**
 * Main run
 */

async function run() {
    let config;
    const cli = argvParser(process.argv);
    const args = <ArgvInterface> cli.argv;

    try {
        config = await getConfiguration(args.config, cli);
        const build = new BuildDirective(config);
        if (args.dev) {
            return await build.dev();
        }

        await build.run();
    } catch (error) {
        console.log(error);
    }
}

run();
