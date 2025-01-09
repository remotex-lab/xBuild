/**
 * Import will remove at compile time
 */

import type { BuildState } from '@providers/interfaces/plugins.interfaces';

/**
 * The `BuildStateInterface` extends the `BuildState` interface to include additional properties related to the build
 * process, specifically for handling `ifdef` conditions and function removals in macros.
 *
 * @interface BuildStateInterface
 */

export interface BuildStateInterface extends BuildState{
    ifdef: Array<string>
    macros: {
        removeFunctions: Set<string>
    };
}
