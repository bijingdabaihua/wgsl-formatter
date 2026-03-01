/**
 * Tests for newline style preservation (CRLF vs LF)
 * Validates: Requirement 10.5
 */

import { describe, it, expect, vi } from 'vitest';
import { FormatterEngine } from '../../src/formatter';

// Mock VSCode API
vi.mock('vscode', () => ({
    window: {
        createOutputChannel: vi.fn(() => ({
            appendLine: vi.fn(),
            show: vi.fn(),
        })),
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
    },
}));

describe('Newline Style Preservation', () => {
    const formatter = new FormatterEngine();
    const defaultOptions = {
        indentSize: 4,
        useTabs: false,
        insertFinalNewline: true,
        trimTrailingWhitespace: true,
    };

    it('should preserve LF newlines (Unix/Mac)', () => {
        const source = 'fn main() {\n    return;\n}';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\n');
        expect(result.formattedText).not.toContain('\r\n');
    });

    it('should preserve CRLF newlines (Windows)', () => {
        const source = 'fn main() {\r\n    return;\r\n}';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\r\n');
        // Count CRLF occurrences
        const crlfCount = (result.formattedText.match(/\r\n/g) || []).length;
        expect(crlfCount).toBeGreaterThan(0);
    });

    it('should detect CRLF even with mixed newlines', () => {
        // If source has at least one CRLF, use CRLF for output
        const source = 'fn main() {\r\n    return;\n}';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\r\n');
    });

    it('should preserve LF in range formatting', () => {
        const source = 'fn main() {\n    return;\n}\n\nfn test() {\n    return;\n}';
        const result = formatter.formatRange(source, 0, 2, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\n');
        expect(result.formattedText).not.toContain('\r\n');
    });

    it('should preserve CRLF in range formatting', () => {
        const source = 'fn main() {\r\n    return;\r\n}\r\n\r\nfn test() {\r\n    return;\r\n}';
        const result = formatter.formatRange(source, 0, 2, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\r\n');
    });

    it('should preserve newline style with struct declarations', () => {
        const source = 'struct Vertex {\r\n    position: vec3<f32>,\r\n    normal: vec3<f32>,\r\n}';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\r\n');
        const crlfCount = (result.formattedText.match(/\r\n/g) || []).length;
        expect(crlfCount).toBeGreaterThan(0);
    });

    it('should preserve newline style with comments', () => {
        const source = '// Comment\r\nfn main() {\r\n    return;\r\n}';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\r\n');
    });

    it('should handle empty file with LF', () => {
        const source = '';
        const result = formatter.format(source, defaultOptions);

        expect(result.success).toBe(true);
        // Empty file should get a final newline (LF by default)
        expect(result.formattedText).toBe('\n');
    });

    it('should preserve newline style on syntax error', () => {
        const source = 'fn main( {\r\n    invalid syntax\r\n}';
        const result = formatter.format(source, defaultOptions);

        // On error, original content is returned unchanged
        expect(result.success).toBe(false);
        expect(result.formattedText).toBe(source);
        expect(result.formattedText).toContain('\r\n');
    });
});
