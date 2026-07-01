/**
 * Indentation Rule - Handles code indentation based on nesting level
 *
 * Spec Reference: SPEC.md §1 - Indentation
 */

/**
 * IndentationRule class
 */
export class IndentationRule {
    /**
     * Get indentation string based on context
     * Spec: §1.1 - Configurable indent size
     */
    getIndentString(indentLevel: number, indentSize: number, useTabs: boolean): string {
        if (useTabs) {
            return '\t'.repeat(indentLevel);
        }
        return ' '.repeat(indentLevel * indentSize);
    }

    /**
     * Check if node should increase indent level for its children
     */
    shouldIncreaseIndent(nodeType: string): boolean {
        return [
            'FunctionDecl', 'StructDecl', 'IfStmt', 'ForStmt',
            'WhileStmt', 'LoopStmt', 'SwitchStmt', 'CaseStmt',
        ].includes(nodeType);
    }
}
