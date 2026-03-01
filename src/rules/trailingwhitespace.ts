/**
 * Trailing Whitespace Rule - Removes trailing whitespace from lines
 */

import { ASTNode } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * TrailingWhitespaceRule class
 */
export class TrailingWhitespaceRule implements FormattingRule {
    /**
     * Apply trailing whitespace rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This rule is applied as post-processing
        // It doesn't need to do anything during AST traversal
    }

    /**
     * Remove trailing whitespace from all lines
     */
    removeTrailingWhitespace(text: string): string {
        return text
            .split('\n')
            .map(line => this.removeTrailingWhitespaceFromLine(line))
            .join('\n');
    }

    /**
     * Remove trailing whitespace from a single line
     */
    removeTrailingWhitespaceFromLine(line: string): string {
        // Remove spaces and tabs at the end of the line
        return line.replace(/[ \t]+$/, '');
    }

    /**
     * Check if line has trailing whitespace
     */
    hasTrailingWhitespace(line: string): boolean {
        return /[ \t]+$/.test(line);
    }
}
