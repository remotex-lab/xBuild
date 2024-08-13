/**
 * Import will remove at compile time
 */

import type { Plugin } from 'esbuild';

/**
 * Imports
 */

import { promises } from 'fs';
import { defPlugin } from '@plugins/ifdef.plugin';


jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

// Helper function to simulate esbuild build
async function simulateBuild(plugin: Plugin, filePath: string, fileContent: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const build: any = {
            onLoad: jest.fn(),
            onEnd: jest.fn()
        };

        // Mock the onLoad handler to simulate esbuild's file processing
        build.onLoad.mockImplementation(({ filter }: { filter: RegExp }, handler: any) => {
            if (filter.test(filePath)) {
                handler({ path: filePath })
                    .then((result: any) => resolve(result.contents))
                    .catch(reject);
            }
        });

        // Mock the onEnd handler to simulate the end of the build process
        build.onEnd.mockImplementation((callback: any) => {
            callback({ metafile: null }); // Example: No metafile in this mock
        });

        // Set up the plugin with the mocked build object
        plugin.setup(build);
    });
}

describe('defPlugin', () => {
    beforeEach(() => {
        // Reset mock implementations before each test
        (promises.readFile as jest.Mock).mockReset();
    });

    it('should include content based on defines', async () => {
        const fileContent = `
            //ifdef TEST
            console.log('x');
            //endif
            //ifdef TESTX
            console.log('x2');
            //endif
        `;

        (promises.readFile as jest.Mock).mockResolvedValue(fileContent);

        const plugin: Plugin = defPlugin({ defines: { TEST: 'true' } });
        const processedContent = await simulateBuild(plugin, 'test.ts', fileContent);

        // Verify the content
        expect(processedContent).toContain('console.log(\'x\');');
        expect(processedContent).not.toContain('console.log(\'x2\');');
    });

    it('should handle multiple file types', async () => {
        const fileContent = `
            //#ifdef TEST
            console.log('x');
            //#endif
        `;

        (promises.readFile as jest.Mock).mockResolvedValue(fileContent);

        const plugin: Plugin = defPlugin({ defines: { TEST: 'true' } }, [ 'js' ]);

        const processedContent = await simulateBuild(plugin, 'test.js', fileContent);

        // Verify the content
        expect(processedContent).toContain('console.log(\'x\');');
    });
});
