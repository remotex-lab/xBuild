/**
 * Import will remove at compile time
 */

import type {
    BuildResult,
    OnLoadArgs,
    PluginBuild,
    OnEndResult,
    OnLoadResult,
    OnResolveArgs,
    OnResolveResult
} from 'esbuild';

/**
 * A type that defines the possible return values of a plugin function.
 * The function can return a Promise that resolves to `null` or `void`, or it can return `null` or `void` directly.
 */

export type pluginResultType = Promise<null | void> | null | void;

/**
 * Defines the signature of a function that is called at the end of the build process.
 *
 * @param result - The `BuildResult` object that contains information about the outcome of the build process.
 * @returns A `pluginResultType`, which may include asynchronous operations.
 */

export type OnEndType = (result: BuildResult) => pluginResultType | OnEndResult | Promise<OnEndResult>;

/**
 * Defines the signature of a function that is called at the start of the build process.
 *
 * @param build - The `PluginBuild` object that contains information about the build process and allows modifying build options.
 * @returns A `pluginResultType`, which may include asynchronous operations.
 */

export type OnStartType = (build: PluginBuild) => pluginResultType | OnEndResult | Promise<OnEndResult>;

/**
 * Defines the signature of a function that is called during the resolution of an import path.
 *
 * @param args - The `OnResolveArgs` object, containing information about the file being resolved, such as its path, importer, namespace, etc.
 * @returns A `Promise` or a direct `OnResolveResult` which can modify the resolved path, or a `pluginResultType` for
 * performing additional async tasks without altering resolution.
 */

export type OnResolveType = (args: OnResolveArgs) => Promise<OnResolveResult | pluginResultType> | OnResolveResult | pluginResultType;

/**
 * Defines the signature of a function that is called when a file is loaded.
 *
 * @param content - The content of the file being loaded, as either a `string` or `Uint8Array`.
 * @param loader - The type of loader used for the file, such as `js`, `ts`, `json`, or others. It can also be `undefined`.
 * @param args - The `OnLoadArgs` object, containing information about the file being loaded, such as its path, namespace, etc.
 * @returns A `Promise` or direct `OnLoadResult`, which can modify the file content and loader, or a `pluginResultType`
 * for performing additional async tasks without altering the content.
 */

export type OnLoadType = (
    content: string | Uint8Array,
    loader: string | undefined,
    args: OnLoadArgs
) => Promise<OnLoadResult | pluginResultType> | OnLoadResult | pluginResultType;
