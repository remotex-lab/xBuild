/**
 * Parses and filters content based on conditional directives.
 *
 * This function processes the given code contents and removes sections that
 * are conditionally compiled based on the provided `defines` object.
 *
 * @param contents - The code contents to be processed.
 * @param defines - An object containing conditional
 *   definitions. Keys are condition names, and values are their definitions.
 * @returns The processed code contents with conditional blocks removed
 *   according to the `defines` object.
 */

export function parseIfDefConditionals(contents: string, defines: Record<string, unknown>): string {
    return contents.replace(/\/\/\s?ifdef\s?(\w+)([\s\S]*?)\/\/\s?endif/g, (match, condition, code) => {
        // Check if the condition is defined
        return defines[condition] ? code : '';
    });
}
