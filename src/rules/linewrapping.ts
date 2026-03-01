/**
 * Line Wrapping Rule - Handles line length limits and automatic line wrapping
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8, 11.9
 */

import { Expression, FunctionDecl } from '../ast';

/**
 * Break point information for expression wrapping
 */
interface BreakPoint {
    left: Expression;
    operator: string;
    right: Expression;
    priority: number;
}

/**
 * Line Wrapping Rule class
 * Implements intelligent line wrapping for long lines
 */
export class LineWrappingRule {
    /**
     * Check if a line should be wrapped based on max length
     * Validates: Requirement 11.3
     * 
     * @param line - Line to check
     * @param maxLength - Maximum allowed line length
     * @returns true if line should be wrapped
     */
    shouldWrap(line: string, maxLength: number): boolean {
        return line.length > maxLength;
    }

    /**
     * Wrap function signature across multiple lines
     * Validates: Requirements 11.4, 11.5, 11.6
     * 
     * Strategy:
     * - Each parameter on its own line with extra indentation
     * - Closing paren and return type on separate line
     * - Opening brace on new line
     * 
     * @param func - Function declaration to wrap
     * @param indent - Base indentation string
     * @param indentUnit - Single indentation unit (spaces or tab)
     * @param maxLength - Maximum line length
     * @returns Array of formatted lines
     */
    wrapFunctionSignature(
        func: FunctionDecl,
        indent: string,
        indentUnit: string,
        maxLength: number
    ): string[] {
        const lines: string[] = [];

        // Add attributes (each on its own line)
        for (const attr of func.attributes) {
            lines.push(`${indent}@${attr.name}`);
        }

        // Build full signature to check if wrapping is needed
        const params = func.parameters
            .map(p => `${p.name}: ${p.varType}`)
            .join(', ');
        const returnType = func.returnType ? ` -> ${func.returnType}` : '';
        const fullSignature = `${indent}fn ${func.name}(${params})${returnType} {`;

        // If signature fits on one line, return it as-is
        if (fullSignature.length <= maxLength) {
            lines.push(fullSignature);
            return lines;
        }

        // Signature needs wrapping
        lines.push(`${indent}fn ${func.name}(`);

        // Each parameter on its own line with extra indentation
        const paramIndent = indent + indentUnit;
        for (let i = 0; i < func.parameters.length; i++) {
            const param = func.parameters[i];
            const paramLine = `${paramIndent}${param.name}: ${param.varType}`;
            const suffix = i < func.parameters.length - 1 ? ',' : '';
            lines.push(paramLine + suffix);
        }

        // Closing paren and return type on separate line
        lines.push(`${indent})${returnType}`);

        // Opening brace on new line
        lines.push(`${indent}{`);

        return lines;
    }

    /**
     * Wrap long expression at operator boundaries
     * Validates: Requirements 11.8, 11.9
     * 
     * Strategy:
     * - Break at binary operators
     * - Prefer lower-priority operators (e.g., + before *)
     * - Keep operator at end of line
     * - Use extra indentation for continuation lines
     * 
     * @param expr - Expression to wrap
     * @param indent - Base indentation string
     * @param indentUnit - Single indentation unit
     * @param maxLength - Maximum line length
     * @returns Array of formatted lines
     */
    wrapExpression(
        expr: Expression,
        indent: string,
        indentUnit: string,
        maxLength: number
    ): string[] {
        const lines: string[] = [];

        // If not a binary expression, no wrapping needed
        if (expr.kind !== 'binary') {
            lines.push(indent + this.formatExpression(expr));
            return lines;
        }

        // Find all operator break points
        const breakPoints = this.findOperatorBreakPoints(expr);

        // Sort by priority (lower priority = break first)
        breakPoints.sort((a, b) => a.priority - b.priority);

        // Build wrapped expression
        const contIndent = indent + indentUnit;
        let currentLine = indent;
        let remainingExpr = this.formatExpression(expr);

        // Try to fit expression on one line first
        if ((indent + remainingExpr).length <= maxLength) {
            lines.push(indent + remainingExpr);
            return lines;
        }

        // Need to wrap - use a simpler strategy
        // Split at operators and wrap when line gets too long
        const parts = this.splitExpressionAtOperators(expr);
        currentLine = indent + parts[0];

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            // Check if adding this part would exceed max length
            if ((currentLine + ' ' + part).length > maxLength) {
                // Finish current line and start new one
                lines.push(currentLine);
                currentLine = contIndent + part;
            } else {
                // Add to current line
                currentLine += ' ' + part;
            }
        }

        // Add final line
        if (currentLine.trim().length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * Format an expression as a string
     * 
     * @param expr - Expression to format
     * @returns Formatted expression string
     */
    private formatExpression(expr: Expression): string {
        switch (expr.kind) {
            case 'literal':
                return String(expr.value);

            case 'identifier':
                return expr.value as string;

            case 'binary':
                const left = this.formatExpression(expr.left!);
                const right = this.formatExpression(expr.right!);
                return `${left} ${expr.operator} ${right}`;

            case 'unary':
                const operand = this.formatExpression(expr.operand!);
                return `${expr.operator}${operand}`;

            case 'call':
                const args = expr.arguments?.map(arg => this.formatExpression(arg)).join(', ') || '';
                return `${expr.callee}(${args})`;

            default:
                return '';
        }
    }

    /**
     * Find all operator break points in an expression
     * 
     * @param expr - Expression to analyze
     * @returns Array of break points
     */
    private findOperatorBreakPoints(expr: Expression): BreakPoint[] {
        const breakPoints: BreakPoint[] = [];

        const traverse = (e: Expression) => {
            if (e.kind === 'binary' && e.left && e.right && e.operator) {
                const priority = this.getOperatorPriority(e.operator);
                breakPoints.push({
                    left: e.left,
                    operator: e.operator,
                    right: e.right,
                    priority,
                });
                traverse(e.left);
                traverse(e.right);
            }
        };

        traverse(expr);
        return breakPoints;
    }

    /**
     * Split expression into parts at operators
     * Returns array of strings like ["a", "+ b", "* c"]
     * 
     * @param expr - Expression to split
     * @returns Array of expression parts
     */
    private splitExpressionAtOperators(expr: Expression): string[] {
        const parts: string[] = [];

        const traverse = (e: Expression, isFirst: boolean = false): void => {
            if (e.kind === 'binary' && e.left && e.right && e.operator) {
                // Process left side
                traverse(e.left, isFirst);

                // Add operator and right side
                const rightStr = this.formatExpression(e.right);
                parts.push(`${e.operator} ${rightStr}`);
            } else {
                // Leaf node
                parts.push(this.formatExpression(e));
            }
        };

        traverse(expr, true);
        return parts;
    }

    /**
     * Get operator priority for wrapping decisions
     * Lower priority = wrap first
     * 
     * @param operator - Operator string
     * @returns Priority number (lower = wrap first)
     */
    private getOperatorPriority(operator: string): number {
        const priorities: { [key: string]: number } = {
            '||': 1,
            '&&': 2,
            '==': 3,
            '!=': 3,
            '<': 4,
            '>': 4,
            '<=': 4,
            '>=': 4,
            '+': 5,
            '-': 5,
            '*': 6,
            '/': 6,
            '%': 6,
        };
        return priorities[operator] || 10;
    }

    /**
     * Check if a token is indivisible (cannot be split)
     * 
     * @param token - Token to check
     * @returns true if token cannot be split
     */
    isSingleIndivisibleToken(token: string): boolean {
        // Check if it's a single identifier, number, or string literal
        const trimmed = token.trim();

        // Identifier pattern
        if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
            return true;
        }

        // Number pattern
        if (/^[0-9]+(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(trimmed)) {
            return true;
        }

        // String literal pattern (if WGSL supports them)
        if (/^"[^"]*"$/.test(trimmed) || /^'[^']*'$/.test(trimmed)) {
            return true;
        }

        return false;
    }
}
