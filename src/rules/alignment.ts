/**
 * Alignment Rule - Handles alignment of struct fields
 */

import { ASTNode, ASTNodeType, StructDecl, VariableDecl } from '../ast';
import { FormattingRule, FormatContext } from '../formatter';

/**
 * AlignmentRule class
 */
export class AlignmentRule implements FormattingRule {
    /**
     * Apply alignment rule to AST node
     */
    apply(_node: ASTNode, _context: FormatContext): void {
        // This method will be called during AST traversal
        // Alignment is specifically applied to struct fields
    }

    /**
     * Calculate alignment for struct fields
     * Returns the column position where types should start
     */
    calculateFieldAlignment(fields: VariableDecl[]): number {
        if (fields.length === 0) {
            return 0;
        }

        // Find the longest field name
        let maxNameLength = 0;
        for (const field of fields) {
            if (field.name.length > maxNameLength) {
                maxNameLength = field.name.length;
            }
        }

        // Add padding for colon and space (": ")
        return maxNameLength + 2;
    }

    /**
     * Format struct fields with alignment
     */
    formatStructFields(struct: StructDecl, indentString: string): string[] {
        const fields = struct.fields;
        const lines: string[] = [];

        if (fields.length === 0) {
            return lines;
        }

        // Calculate alignment column
        const alignColumn = this.calculateFieldAlignment(fields);

        // Format each field
        for (const field of fields) {
            const nameWithColon = `${field.name}:`;
            const padding = ' '.repeat(alignColumn - nameWithColon.length);
            const line = `${indentString}${nameWithColon}${padding}${field.varType},`;
            lines.push(line);
        }

        return lines;
    }

    /**
     * Check if a node is a struct declaration
     */
    isStructDecl(node: ASTNode): node is StructDecl {
        return node.type === ASTNodeType.StructDecl;
    }
}
