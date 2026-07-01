/**
 * Spacing Rule - Handles spacing around operators and punctuation
 *
 * Spec Reference: SPEC.md §3 - Spacing Rules
 * Spec: §3.1-§3.10 - All spacing rules
 */

import { Expression } from '../ast';

/**
 * SpacingRule class
 * Provides static spacing utilities for the formatter
 */
export class SpacingRule {
    /**
     * Format expression with proper spacing
     * Spec: §3 - All spacing rules
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
                return String(expr.value ?? '');

            case 'identifier':
                return String(expr.value ?? '');

            case 'memberAccess':
                return `${this.formatExpression(expr.object!)}.${expr.member}`;

            case 'indexAccess':
                return `${this.formatExpression(expr.object!)}[${this.formatExpression(expr.index!)}]`;

            default:
                return '';
        }
    }

    /**
     * Format binary expression with spacing around operators
     * Spec: §3.1 - Spaces around all binary operators
     */
    private formatBinaryExpression(expr: Expression): string {
        if (!expr.left || !expr.right || !expr.operator) return '';
        const left = this.formatExpression(expr.left);
        const right = this.formatExpression(expr.right);
        return `${left} ${expr.operator} ${right}`;
    }

    /**
     * Format unary expression
     * Spec: §3.2 - No space after unary operator
     */
    private formatUnaryExpression(expr: Expression): string {
        if (!expr.operand || !expr.operator) return '';
        return `${expr.operator}${this.formatExpression(expr.operand)}`;
    }

    /**
     * Format function call
     * Spec: §3.8 - No space before (, space after comma
     */
    private formatCallExpression(expr: Expression): string {
        if (!expr.callee) return '';
        const callee = expr.callee;
        const args = (expr.arguments || [])
            .map(arg => this.formatExpression(arg))
            .join(', ');
        return `${callee}(${args})`;
    }
}
