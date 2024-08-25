/**
 * Import will remove at compile time
 */

import type { BuildResult, Plugin, PluginBuild } from 'esbuild';

export function rebuildPlugin(onStart: (build: PluginBuild) => Promise<void>, onEnd: (result: BuildResult, build: PluginBuild) => Promise<void>): Plugin {
    return {
        name: 'rebuild-notify',
        setup(build) {
            build.onStart(async () => {
                await onStart(build);
            });
            build.onEnd(async (result) => {
                await onEnd(result, build);
            });
        }
    };
}
