/**
 * Final Newline Rule - Ensures file ends with exactly one newline
 */

import { ASTNode } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * FinalNewlineRule class
 */
export class FinalNewlineRule implements FormattingRule {
    /**
     * Apply final newline rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This rule is applied as post-processing
        // It doesn't need to do anything during AST traversal
    }

    /**
     * Ensure file ends with exactly one newline
     */
    ensureFinalNewline(text: string): string {
        // Remove all trailing newlines
        text = text.replace(/\n+$/, '');
        
        // Add exactly one newline
        return text + '\n';
    }

    /**
     * Check if text ends with a newline
     */
    endsWithNewline(text: string): boolean {
        return text.endsWith('\n');
    }

    /**
     * Count trailing newlines
     */
    countTrailingNewlines(text: string): number {
        const match = text.match(/\n+$/);
        return match ? match[0].length : 0;
    }
}
