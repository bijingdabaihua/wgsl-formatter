/**
 * Indentation Rule - Handles code indentation based on nesting level
 */

import { ASTNode, ASTNodeType } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * IndentationRule class
 */
export class IndentationRule implements FormattingRule {
    /**
     * Apply indentation rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This method will be called during AST traversal
        // The actual indentation is applied by getIndentString
    }

    /**
     * Get indentation string based on context
     */
    getIndentString(context: FormatContext): string {
        const { indentLevel, options } = context;
        
        if (options.useTabs) {
            return '\t'.repeat(indentLevel);
        } else {
            return ' '.repeat(indentLevel * options.indentSize);
        }
    }

    /**
     * Calculate indent level for a given node type
     */
    calculateIndentLevel(node: ASTNode, currentLevel: number): number {
        switch (node.type) {
            case ASTNodeType.FunctionDecl:
            case ASTNodeType.StructDecl:
                // Function and struct bodies are indented
                return currentLevel;
            
            case ASTNodeType.Statement:
                // Statements inside blocks are indented
                return currentLevel;
            
            default:
                return currentLevel;
        }
    }

    /**
     * Check if node should increase indent level for its children
     */
    shouldIncreaseIndent(node: ASTNode): boolean {
        return (
            node.type === ASTNodeType.FunctionDecl ||
            node.type === ASTNodeType.StructDecl
        );
    }
}
