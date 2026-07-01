/**
 * Trailing Whitespace Rule - Removes trailing whitespace from lines
 *
 * Spec Reference: SPEC.md §11.4 - No trailing whitespace
 */

/**
 * TrailingWhitespaceRule class
 */
export class TrailingWhitespaceRule {
    /**
     * Remove trailing whitespace from all lines
     */
    removeTrailingWhitespace(text: string): string {
        return text.split('\n')
            .map(line => line.replace(/[ \t]+$/, ''))
            .join('\n');
    }

    /**
     * Check if line has trailing whitespace
     */
    hasTrailingWhitespace(line: string): boolean {
        return /[ \t]+$/.test(line);
    }
}
