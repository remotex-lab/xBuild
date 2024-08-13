/**
 * Import will remove at compile time
 */

import type { BuildOptions, ServeOnRequestArgs } from 'esbuild';

/**
 * Recursive type alias for a partial configuration object.
 *
 * This type represents a configuration where all properties of the
 * `ConfigurationInterface`, including those in nested objects, are optional.
 * It allows for flexible configuration objects where only a subset of
 * properties, at any depth, need to be specified.
 */

export type PartialDeep<T> = {
    [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P];
};

/**
 * Interface for the configuration options used by the build system.
 */

export interface ConfigurationInterface {
    /**
     * Build and run as dev
     */

    dev: boolean;

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
     * Defines replacements for constants in the codebase.
     * these constants are replaced with the corresponding
     * values using `esbuild`'s `define` option. The values are automatically converted to strings using `toString()`, ensuring
     * that they are correctly formatted as literal values in the output code.
     */

    defines: {
        [key: string]: unknown;
    }

    /**
     * Options for the esbuild bundler.
     */

    esbuild: BuildOptions;

    /**
     * Configuration for the HTTP server if serving the build output.
     */

    serve: {
        active: boolean,
        port?: number
        host?: string
        servedir?: string
        keyfile?: string
        certfile?: string
        fallback?: string
        onRequest?: (args: ServeOnRequestArgs) => void
    }
}

/**
 * Type alias for a partial configuration object.
 *
 * This type represents a configuration where all properties of the
 * `ConfigurationInterface` are optional. It allows for flexible configuration
 * objects where only a subset of properties need to be specified.
 */

export type xBuildConfig = PartialDeep<ConfigurationInterface>;

/**
 * Represents a module with exports.
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
