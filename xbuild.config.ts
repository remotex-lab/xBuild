import { version } from 'process';
import type { xBuildConfig } from '@remotex-labs/xbuild';

const config: xBuildConfig = {
    declaration: false,
    buildOnError: true,
    esbuild: {
        bundle: true,
        minify: true,
        target: [ `node${ version.slice(1) }` ],
        platform: 'node',
        external: [ 'esbuild', 'process' ],
        sourcemap: true,
        entryPoints: [ 'src/index.ts' ]
    }
};

export default config;
