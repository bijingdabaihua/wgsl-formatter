/**
 * Blank Line Rule - Handles blank lines for logical grouping
 */

import { ASTNode } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * BlankLineRule class
 */
export class BlankLineRule implements FormattingRule {
    /**
     * Apply blank line rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This method will be called during AST traversal
        // Blank lines are preserved during formatting
    }

    /**
     * Normalize consecutive blank lines to at most one blank line
     */
    normalizeBlankLines(text: string): string {
        // Replace multiple consecutive newlines with at most two newlines (one blank line)
        return text.replace(/\n{3,}/g, '\n\n');
    }

    /**
     * Check if a line is blank (empty or only whitespace)
     */
    isBlankLine(line: string): boolean {
        return line.trim().length === 0;
    }

    /**
     * Preserve blank lines between declarations
     * Returns normalized lines with proper blank line spacing
     */
    preserveBlankLines(lines: string[]): string[] {
        const result: string[] = [];
        let consecutiveBlankLines = 0;

        for (const line of lines) {
            if (this.isBlankLine(line)) {
                consecutiveBlankLines++;
                // Only add one blank line maximum
                if (consecutiveBlankLines === 1) {
                    result.push('');
                }
            } else {
                consecutiveBlankLines = 0;
                result.push(line);
            }
        }

        return result;
    }

    /**
     * Should add blank line before this node
     */
    shouldAddBlankLineBefore(node: ASTNode, previousNode: ASTNode | null): boolean {
        // Add blank line between top-level declarations
        if (!previousNode) {
            return false;
        }

        // Add blank line between different types of declarations
        return node.type !== previousNode.type;
    }
}
