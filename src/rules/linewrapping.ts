/**
 * Line Wrapping Rule - Handles line length limits and automatic line wrapping
 *
 * Spec Reference: SPEC.md §5 - Line Wrapping Rules
 * Spec: §5.1 - Max line length (default 100)
 * Spec: §5.2 - Function signature wrapping
 * Spec: §5.3 - Expression wrapping
 * Spec: §5.4 - Function call wrapping
 * Spec: §5.5 - Struct always multi-line
 */

import { FunctionDecl } from '../ast';

/**
 * Line Wrapping Rule class
 */
export class LineWrappingRule {
    /**
     * Check if a line should be wrapped based on max length
     * Spec: §5.1 - Max line length
     */
    shouldWrap(line: string, maxLength: number): boolean {
        return line.length > maxLength;
    }

    /**
     * Wrap function signature across multiple lines
     * Spec: §5.2 - Each parameter on its own line
     */
    wrapFunctionSignature(
        func: FunctionDecl,
        indent: string,
        indentUnit: string,
        maxLength: number
    ): string[] {
        const lines: string[] = [];

        // Attributes on their own line (each)
        for (const attr of func.attributes) {
            let attrStr = `@${attr.name}`;
            if (attr.arguments.length > 0) {
                attrStr += `(${attr.arguments.join(', ')})`;
            }
            lines.push(`${indent}${attrStr}`);
        }

        // Build params to check if wrapping is needed
        const params = func.parameters
            .map(p => {
                const attrPrefix = p.attributes.length > 0
                    ? p.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ') + ' '
                    : '';
                return `${attrPrefix}${p.name}: ${p.varType}`;
            })
            .join(', ');
        const returnType = func.returnType ? ` -> ${func.returnType}` : '';
        const fullSignature = `${indent}fn ${func.name}(${params})${returnType} {`;

        if (fullSignature.length <= maxLength) {
            lines.push(fullSignature);
            return lines;
        }

        // Need wrapping
        lines.push(`${indent}fn ${func.name}(`);

        // Each parameter on its own line
        const paramIndent = indent + indentUnit;
        for (let i = 0; i < func.parameters.length; i++) {
            const p = func.parameters[i];
            const attrPrefix = p.attributes.length > 0
                ? p.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ') + ' '
                : '';
            const paramLine = `${paramIndent}${attrPrefix}${p.name}: ${p.varType}`;
            const suffix = i < func.parameters.length - 1 ? ',' : '';
            lines.push(paramLine + suffix);
        }

        // Closing paren and return type
        lines.push(`${indent})${returnType}`);

        // Opening brace
        lines.push(`${indent}{`);

        return lines;
    }

    /**
     * Check if a token is indivisible (cannot be split)
     */
    isSingleIndivisibleToken(token: string): boolean {
        const trimmed = token.trim();
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) return true;
        if (/^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?[fui]?$/.test(trimmed)) return true;
        return false;
    }
}
