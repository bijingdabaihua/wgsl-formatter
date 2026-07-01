/**
 * Blank Line Rule - Handles blank lines for logical grouping
 *
 * Spec Reference: SPEC.md §6 - Blank Lines
 * Spec: §6.1 - Between top-level declarations
 * Spec: §6.2 - Within functions (max 1 blank line)
 * Spec: §6.3 - File ending
 */

/**
 * BlankLineRule class
 */
export class BlankLineRule {
    /**
     * Normalize consecutive blank lines to at most one blank line
     * Spec: §6.2 - Max 1 consecutive blank line
     */
    normalizeBlankLines(text: string): string {
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
     * Spec: §6.2
     */
    preserveBlankLines(lines: string[]): string[] {
        const result: string[] = [];
        let consecutiveBlankLines = 0;

        for (const line of lines) {
            if (this.isBlankLine(line)) {
                consecutiveBlankLines++;
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
}
