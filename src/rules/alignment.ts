/**
 * Alignment Rule - Handles alignment of struct fields and parameters
 *
 * Spec Reference: SPEC.md §4 - Alignment Rules
 * Spec: §4.1 - Struct field alignment
 * Spec: §4.2 - Function parameter alignment (multi-line)
 */

import { StructField } from '../ast';

/**
 * AlignmentRule class
 */
export class AlignmentRule {
    /**
     * Calculate alignment for struct fields
     * Spec: §4.1 - Find longest field name (including attributes)
     *
     * @param fields - Struct fields
     * @returns The column position where types should start
     */
    calculateFieldAlignment(fields: StructField[]): number {
        if (fields.length === 0) return 0;

        let maxNameLength = 0;
        for (const field of fields) {
            const attrStr = field.attributes.length > 0
                ? field.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ') + ' '
                : '';
            const nameWithColon = `${attrStr}${field.name}:`;
            if (nameWithColon.length > maxNameLength) {
                maxNameLength = nameWithColon.length;
            }
        }

        return maxNameLength + 2; // +2 for ": " after the longest name
    }

    /**
     * Check if a node is a struct declaration
     */
    isStructDecl(nodeType: string): boolean {
        return nodeType === 'StructDecl';
    }
}
