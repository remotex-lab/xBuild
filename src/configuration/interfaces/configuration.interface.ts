/**
 * Import will remove at compile time
 */

import type { BuildOptions } from 'esbuild';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Represents the format for specifying entry points in TypeScript declaration generation.
 *
 * This type allows for various formats to specify the entry points from which TypeScript declaration files should be generated.
 * The supported formats are:
 * - `Array<string>`: An array of file paths as strings. Each string represents a path to a TypeScript entry point file.
 * - `Record<string, string>`: An object where each key-value pair represents an entry point.
 *
 * The key is a name or identifier, and the value is the file path to the TypeScript entry point.
 * - `Array<{ in: string, out: string }>`: An array of objects, where each object specifies an input file path (`in`)
 * and an output file path (`out`). This format allows for specifying where each entry point file is located and
 * where its corresponding declaration file should be output.
 *
 * Example usage:
 *
 * ```typescript
 * const entryPoints1: EntryPoints = ['src/index.ts', 'src/utils.ts'];
 * const entryPoints2: EntryPoints = { main: 'src/index.ts', utils: 'src/utils.ts' };
 * const entryPoints3: EntryPoints = [{ in: 'src/index.ts', out: 'dist/index.d.ts' }, { in: 'src/utils.ts', out: 'dist/utils.d.ts' }];
 * ```
 */

export type EntryPoints = Array<string> | Record<string, string> | Array<{ in: string, out: string }> | undefined;

/**
 * Represents a deeply nested partial version of a given type `T`.
 *
 * This type utility allows for partial objects at any level of nesting.
 * It recursively makes all properties optional and applies the same behavior to nested objects.
 *
 * **Example Usage:**
 *
 * ```typescript
 * interface User {
 *     name: string;
 *     address: {
 *         street: string;
 *         city: string;
 *     };
 * }
 *
 * // PartialDeep<User> will allow the following:
 * const partialUser: PartialDeep<User> = {
 *     name: 'Alice',        // 'name' is optional
 *     address: {
 *         city: 'Wonderland' // 'street' is optional
 *     }
 * };
 * ```
 *
 * @template T - The type to be made partially optional and deeply nested.
 *
 * @typeParam T - The base type to apply the partial transformation.
 *
 * @example
 * ```
 * type MyPartial = PartialDeep<{ a: number; b: { c: string; d: { e: boolean } } }>;
 * // MyPartial will be equivalent to:
 * // {
 * //   a?: number;
 * //   b?: {
 * //     c?: string;
 * //     d?: {
 * //       e?: boolean;
 * //     }
 * //   }
 * // }
 * ```
 */

export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Represents a module with its exports and an optional default export.
 *
 * This interface provides a structure to define and interact with the exports of a module.
 * It includes both named and default exports, where default exports are of a specific type.
 *
 * @interface ModuleInterface
 *
 * @property exports - An object representing the exports of the module.
 * The keys are strings that represent the names of the exports, and the values can be of any type.
 *
 * @property exports[key: string] - A dictionary where each key is a string representing the export name,
 * and the associated value can be of any type.
 *
 * @property [exports.default] - An optional default export.
 * The default export, if present, is of type `ConfigurationInterface`.
 */

export interface ModuleInterface {

    /**
     * An object representing the exports of the module.
     * The keys are strings representing export names, and the values can be of any type.
     *
     * @property {ConfigurationInterface} [default] - An optional default export of type `ConfigurationInterface`.
     */

    exports: {
        [key: string]: unknown;
        default?: ConfigurationInterface;
    };
}

/**
 * Configuration options for the serve the build.
 *
 * This object allows you to specify various settings related to the server,
 * such as the port, host, SSL/TLS certificates, and request handling functions.
 *
 * @example
 * ```typescript
 * const serverConfig = {
 *     serve: {
 *         active: true,
 *         port: 8080,
 *         host: 'localhost',
 *         keyfile: '/path/to/ssl/keyfile.pem',
 *         certfile: '/path/to/ssl/certfile.pem',
 *         onRequest: () => {
 *             console.log('Server request received');
 *         }
 *     }
 * };
 * ```
 *
 * @public
 */

export interface Serve {
    port: number
    host: string
    active: boolean,
    keyfile?: string
    certfile?: string,
    onRequest?: (req: IncomingMessage, res: ServerResponse, next: () => void) => void
}

/**
 * Represents the configuration options for the build and development process.
 *
 * This interface defines various settings that control how the application is built and run, including development mode,
 * file watching, TypeScript declaration generation, error handling, TypeScript type checking, and esbuild bundler options.
 *
 * @example
 * ```typescript
 * const config: ConfigurationInterface = {
 *     dev: true,
 *     watch: true,
 *     declaration: true,
 *     buildOnError: false,
 *     noTypeChecker: false,
 *     esbuild: {
 *         entryPoints: ['./src/index.ts'],
 *         bundle: true,
 *         minify: true,
 *         target: 'es2020'
 *     }
 * };
 * ```
 *
 * In this example, the configuration sets the application to development mode with file watching enabled,
 * generates TypeScript declaration files, continues building on TypeScript errors, and includes esbuild options for bundling and minification.
 *
 * @public
 * @category Configuration
 */

export interface ConfigurationInterface {
    /**
     * Build and run entryPoint for development
     */

    dev: boolean | Array<string>;

    /**
     * Enables watching for file changes during development.
     */

    watch: boolean;

    /**
     * Generates TypeScript declaration files.
     */

    declaration: boolean;

    /**
     * Continues building even if TypeScript type errors are present.
     */

    buildOnError: boolean;

    /**
     * Skips TypeScript type checking.
     */

    noTypeChecker: boolean;

    /**
     * Options for the esbuild bundler.
     */

    esbuild: BuildOptions;

    /**
     * Option for the serve the build over http/s
     */

    serve: Serve;
}

interface ExportedConfigurationInterface extends ConfigurationInterface {
    /**
     * Options for the esbuild bundler.
     */

    esbuild: Omit<BuildOptions, 'plugins' | 'define'>;
}

/**
 * Type alias for a partial configuration object.
 *
 * This type represents a configuration where all properties of the
 * `ConfigurationInterface` are optional. It allows for flexible configuration
 * objects where only a subset of properties need to be specified.
 */

export type xBuildConfig = PartialDeep<ExportedConfigurationInterface>;

// Todo defines, plugins ansi
