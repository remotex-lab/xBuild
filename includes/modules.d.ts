/**
 * TypeScript declaration for importing `.html` files as modules.
 *
 * This declaration allows TypeScript to treat `.html` files as modules,
 * where each HTML file's classes are represented as keys in an object,
 * and the values are the associated class names as strings. This can be
 * useful when you are using a system that processes HTML files and
 * converts them into modular objects (such as CSS modules or a similar system).
 *
 * Example usage:
 *
 * ```typescript
 * import styles from './template.html';
 *
 * console.log(styles["my-class"]); // Outputs the corresponding class name as a string
 * ```
 *
 * @module '*.html'
 * @property {Object} content - An object mapping class names to their string representations.
 * @property {string} content[className] - A class name in the imported HTML file.
 * @exports content - The default export is an object containing the class names.
 */

declare module '*.html' {
    const content: string;
    export default content;
}
