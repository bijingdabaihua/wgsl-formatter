/**
 * Final Newline Rule - Ensures file ends with exactly one newline
 *
 * Spec Reference: SPEC.md §6.3 - File ends with exactly one newline
 */

/**
 * FinalNewlineRule class
 */
export class FinalNewlineRule {
    /**
     * Ensure file ends with exactly one newline
     * Spec: §6.3
     */
    ensureFinalNewline(text: string): string {
        text = text.replace(/\n+$/, '');
        return text + '\n';
    }

    /**
     * Check if text ends with a newline
     */
    endsWithNewline(text: string): boolean {
        return text.endsWith('\n');
    }
}
