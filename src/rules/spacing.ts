/**
 * Spacing Rule - Handles spacing around operators and punctuation
 */

import { ASTNode, Expression } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * SpacingRule class
 */
export class SpacingRule implements FormattingRule {
    /**
     * Apply spacing rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This method will be called during AST traversal
        // Spacing is applied when formatting expressions
    }

    /**
     * Format expression with proper spacing
     */
    formatExpression(expr: Expression): string {
        switch (expr.kind) {
            case 'binary':
                return this.formatBinaryExpression(expr);

            case 'unary':
                return this.formatUnaryExpression(expr);

            case 'call':
                return this.formatCallExpression(expr);

            case 'literal':
                // Preserve float formatting by ensuring .0 suffix for whole numbers
                const value = String(expr.value ?? '');
                // If it's a number and doesn't contain a decimal point, add .0
                if (typeof expr.value === 'number' && !value.includes('.')) {
                    return value + '.0';
                }
                return value;

            case 'identifier':
                return String(expr.value ?? '');

            default:
                return '';
        }
    }

    /**
     * Format binary expression with spacing around operators
     */
    private formatBinaryExpression(expr: Expression): string {
        if (!expr.left || !expr.right || !expr.operator) {
            return '';
        }

        const left = this.formatExpression(expr.left);
        const right = this.formatExpression(expr.right);
        const operator = expr.operator;

        // Add spaces around operators (except for assignment in some contexts)
        return `${left} ${operator} ${right}`;
    }

    /**
     * Format unary expression
     */
    private formatUnaryExpression(expr: Expression): string {
        if (!expr.operand || !expr.operator) {
            return '';
        }

        const operand = this.formatExpression(expr.operand);
        const operator = expr.operator;

        // No space between unary operator and operand
        return `${operator}${operand}`;
    }

    /**
     * Format function call expression with spacing after commas
     */
    private formatCallExpression(expr: Expression): string {
        if (!expr.callee) {
            return '';
        }

        const callee = expr.callee;
        const args = expr.arguments || [];

        // Format arguments with space after comma
        const formattedArgs = args
            .map(arg => this.formatExpression(arg))
            .join(', ');

        return `${callee}(${formattedArgs})`;
    }

    /**
     * Add space after comma
     */
    addSpaceAfterComma(text: string): string {
        // Replace comma not followed by space with comma + space
        return text.replace(/,(?!\s)/g, ', ');
    }

    /**
     * Check if position is at line start or end
     */
    isAtLineEdge(line: string, position: number): boolean {
        return position === 0 || position === line.length;
    }

    /**
     * Check if character is inside parentheses/brackets
     */
    isInsideParentheses(text: string, position: number): boolean {
        let depth = 0;
        for (let i = 0; i < position; i++) {
            if (text[i] === '(' || text[i] === '[' || text[i] === '{') {
                depth++;
            } else if (text[i] === ')' || text[i] === ']' || text[i] === '}') {
                depth--;
            }
        }
        return depth > 0;
    }
}
