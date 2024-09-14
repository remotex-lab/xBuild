/**
 * Import will remove at compile time
 */

import type { PositionSourceInterface } from '@remotex-labs/xmap';

/**
 * Imports
 */

import { BaseError } from '@errors/base.error';
import { SourceService } from '@remotex-labs/xmap';

/**
 * Mocks
 */

jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    readFileSync: jest.fn().mockImplementation((path: string) => {
        return JSON.stringify({
            version: 3,
            file: 'index.js',
            sources: [ 'source.js' ],
            names: [],
            mappings: 'AAAA',
            sourcesContent: [ 'asd' ]
        });
    })
}));

jest.mock('@remotex-labs/xmap', () => ({
    ...jest.requireActual('@remotex-labs/xmap'),
    SourceService: jest.fn().mockImplementation(() => ({
        getSourcePosition: jest.fn().mockReturnValue({
            source: 'src/file.ts',
            sourceRoot: 'src/',
            line: 10,
            column: 5,
            code: 'const a = 1;'
        } as PositionSourceInterface)
    })),
    formatErrorCode: (position: any, options: any) => `formatted ${position.code}`,
    highlightCode: (code: any) => `highlighted ${code}`,
    parseErrorStack: (stack: string) => [
        { file: 'file.js', line: 10, column: 5, at: 'name ' }
    ]
}));

/**
 * Test class
 */

class TestError extends BaseError {
    constructor(message: string, sourceMap?: SourceService) {
        super(message, sourceMap);
    }

    public getStackArray(): string[] {
        return this.stackArray;
    }

    public setStack(stack: string | undefined): void {
        this.reformatStack(stack);
    }

    public getBlockCode(): string | null {
        return this.blockCode;
    }
}

describe('BaseError', () => {
    let testError: TestError;
    let mockSourceService: SourceService;

    beforeEach(() => {
        mockSourceService = new SourceService(<any> 'test');
        testError = new TestError('Test error message', mockSourceService);
    });

    afterEach(() => {
        jest.restoreAllMocks(); // Restore original implementations
    });

    afterAll(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    /**
     * Test case to verify that `TestError` is instantiated correctly.
     *
     * Ensures that the error message and stack are set as expected.
     *
     * Code:
     * ```typescript
     * expect(testError).toBeInstanceOf(TestError);
     * expect(testError.message).toBe('Test error message');
     * expect(testError.stack).toBeDefined();
     * ```
     * Expected result: `TestError` instance is correctly created with the provided message and stack trace.
     */

    test('should create an instance of TestError', () => {
        expect(testError).toBeInstanceOf(TestError);
        expect(testError.message).toBe('Test error message');
        expect(testError.stack).toBeDefined();
    });

    /**
     * Test case to verify that the stack trace is formatted correctly.
     *
     * This test checks that the stack trace is reformatted and returned as an array.
     *
     * Code:
     * ```typescript
     * testError.setStack('Error stack');
     * expect(testError.getStackArray()).toEqual(['at name file.js [10:5]']);
     * ```
     * Expected result: The stack trace is correctly formatted and returned as an array.
     */

    test('should format the stack trace correctly', () => {
        testError.setStack('Error stack');
        expect(testError.getStackArray()).toEqual([
            'at name  \u001b[38;5;238mfile.js\u001b[0m \u001b[38;5;243m[10:5]\u001b[0m'
        ]);
    });


    /**
     * Test case to verify that the block code is formatted correctly.
     *
     * This test checks that the block code is updated and formatted using the provided source position.
     *
     * Code:
     * ```typescript
     * const mockPosition: PositionSourceInterface = <any> {
     *     source: 'src/file.ts',
     *     sourceRoot: 'src/',
     *     line: 10,
     *     column: 5,
     *     code: 'const a = 1;'
     * };
     * (<any> testError).updateBlockCodeIfNecessary(mockPosition);
     * expect(testError.getBlockCode()).toBe('formatted highlighted const a = 1;');
     * ```
     * Expected result: The block code is correctly formatted based on the source position.
     */

    test('should format the block code correctly', () => {
        const mockPosition: PositionSourceInterface = <any> {
            source: 'src/file.ts',
            sourceRoot: 'src/',
            line: 10,
            column: 5,
            code: 'const a = 1;'
        };

        (<any> testError).updateBlockCodeIfNecessary(mockPosition);

        expect(testError.getBlockCode()).toBe('formatted highlighted const a = 1;');
    });

    /**
     * Test case to handle scenarios where no source map service is provided.
     *
     * This test ensures that `TestError` can handle the absence of a source map service gracefully.
     *
     * Code:
     * ```typescript
     * const errorWithoutSourceMap = new TestError('Error without source map');
     * expect(errorWithoutSourceMap).toBeInstanceOf(TestError);
     * expect(errorWithoutSourceMap.stack).toBeDefined();
     * ```
     * Expected result: `TestError` handles the absence of a source map service without issues.
     */

    test('should handle no source map service gracefully', () => {
        const errorWithoutSourceMap = new TestError('Error without source map');
        expect(errorWithoutSourceMap).toBeInstanceOf(TestError);
        expect(errorWithoutSourceMap.stack).toBeDefined();
    });
});
