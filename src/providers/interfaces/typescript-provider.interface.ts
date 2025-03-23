/**
 * Import will remove at compile time
 */

import type * as ts from 'typescript';

/**
 * Represents TypeScript node types that can have modifiers applied to them.
 * This union type includes all declaration types that support TypeScript modifiers
 * like export, default, abstract, public, private, etc.
 *
 * @see ts.ClassDeclaration
 * @see ts.InterfaceDeclaration
 * @see ts.EnumDeclaration
 * @see ts.FunctionDeclaration
 * @see ts.TypeAliasDeclaration
 * @see ts.VariableStatement
 * @see ts.ModuleDeclaration
 *
 * @since 1.5.5
 */

export type NodeWithModifiersType =
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration
    | ts.EnumDeclaration
    | ts.FunctionDeclaration
    | ts.TypeAliasDeclaration
    | ts.VariableStatement
    | ts.ModuleDeclaration;
