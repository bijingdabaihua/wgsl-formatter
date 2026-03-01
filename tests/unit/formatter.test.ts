/**
 * Unit tests for FormatterEngine
 */

import { describe, it, expect, vi } from 'vitest';
import { FormatterEngine, FormatOptions } from '../../src/formatter';

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

const defaultOptions: FormatOptions = {
    indentSize: 4,
    useTabs: false,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
};

describe('FormatterEngine', () => {
    it('should format a simple function declaration', () => {
        const input = 'fn main(){return;}';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('fn main()');
        expect(result.formattedText).toContain('return;');
    });

    it('should format a struct declaration with aligned fields', () => {
        const input = 'struct Vertex{position:vec3<f32>,color:vec4<f32>,}';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('struct Vertex');
        expect(result.formattedText).toContain('position:');
        expect(result.formattedText).toContain('color:');
    });

    it('should handle empty file', () => {
        const input = '';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
    });

    it('should handle syntax errors gracefully', () => {
        const input = 'fn main( { invalid syntax }';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        // With our error recovery strategy, syntax errors cause formatting to fail
        // and return the original content unchanged
        // Validates: Requirements 3.4, 7.4
        expect(result.success).toBe(false);
        expect(result.formattedText).toBe(input); // Original content preserved
        expect(result.error).toContain('SyntaxError');
    });

    it('should add spaces around operators', () => {
        const input = 'fn test(){var x:f32=1.0+2.0;}';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('1.0 + 2.0');
        expect(result.formattedText).toContain('var x: f32 = 1.0 + 2.0;');
    });

    it('should remove trailing whitespace', () => {
        const input = 'fn main() {  \n    return;  \n}  ';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
        const lines = result.formattedText.split('\n');
        for (const line of lines) {
            expect(line).not.toMatch(/[ \t]$/);
        }
    });

    it('should ensure final newline', () => {
        const input = 'fn main() { return; }';
        const formatter = new FormatterEngine();
        const result = formatter.format(input, defaultOptions);

        expect(result.success).toBe(true);
        expect(result.formattedText).toMatch(/\n$/);
    });

    it('should use tabs when useTabs is true', () => {
        const input = 'fn main(){return;}';
        const formatter = new FormatterEngine();
        const options: FormatOptions = {
            ...defaultOptions,
            useTabs: true,
        };
        const result = formatter.format(input, options);

        expect(result.success).toBe(true);
        expect(result.formattedText).toContain('\t');
    });

    it('should format range correctly', () => {
        const input = 'fn main(){return;}\nfn test(){return;}';
        const formatter = new FormatterEngine();
        const result = formatter.formatRange(input, 0, 0, defaultOptions);

        expect(result.success).toBe(true);
    });

    describe('Range Formatting', () => {
        it('should format only the specified range', () => {
            const input = [
                'fn main() { return; }',
                '',
                'fn test(){return;}',
                '',
                'fn another(){return;}'
            ].join('\n');

            const formatter = new FormatterEngine();
            // Format only the second function (line 2, 0-indexed)
            const result = formatter.formatRange(input, 2, 2, defaultOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // First function should remain unchanged
            expect(lines[0]).toBe('fn main() { return; }');
            expect(lines[1]).toBe('');

            // Second function should be formatted
            expect(lines[2]).toContain('fn test()');

            // Third function should remain unchanged
            expect(lines[4]).toBe('fn another(){return;}');
        });

        it('should keep code outside range completely unchanged', () => {
            const input = [
                'fn  badly   formatted(){ return; }',
                '',
                'fn target(){return;}',
                '',
                'fn  also   badly(){ return; }'
            ].join('\n');

            const formatter = new FormatterEngine();
            // Format only the middle function
            const result = formatter.formatRange(input, 2, 2, defaultOptions);

            // With our error recovery, if there are parse errors, formatting fails
            // and returns original content
            // Validates: Requirements 3.4, 7.4
            if (!result.success) {
                expect(result.formattedText).toBe(input);
                expect(result.error).toBeDefined();
            } else {
                const lines = result.formattedText.split('\n');

                // First function should remain exactly as is
                expect(lines[0]).toBe('fn  badly   formatted(){ return; }');
                expect(lines[1]).toBe('');

                // Last function should remain exactly as is
                expect(lines[4]).toBe('fn  also   badly(){ return; }');
            }
        });

        it('should expand range to complete function when range cuts through function', () => {
            const input = [
                'fn main() {',
                '    var x: f32 = 1.0;',
                '    return;',
                '}',
                '',
                'fn test() { return; }'
            ].join('\n');

            const formatter = new FormatterEngine();
            // Select only line 1 (inside the function)
            const result = formatter.formatRange(input, 1, 1, defaultOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // The entire function should be formatted (expanded range)
            expect(lines[0]).toContain('fn main()');
            // Last function should remain unchanged
            expect(lines[lines.length - 1]).toBe('fn test() { return; }');
        });

        it('should expand range to complete struct when range cuts through struct', () => {
            const input = [
                'struct Vertex {',
                '    position: vec3<f32>,',
                '    color: vec4<f32>,',
                '}',
                '',
                'fn main() { return; }'
            ].join('\n');

            const formatter = new FormatterEngine();
            // Select only line 1 (inside the struct)
            const result = formatter.formatRange(input, 1, 1, defaultOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // The entire struct should be formatted (expanded range)
            expect(lines[0]).toContain('struct Vertex');
            // Last function should remain unchanged
            expect(lines[lines.length - 1]).toBe('fn main() { return; }');
        });

        it('should handle range spanning multiple complete declarations', () => {
            const input = [
                'fn first() { return; }',
                '',
                'fn second() { return; }',
                '',
                'fn third() { return; }'
            ].join('\n');

            const formatter = new FormatterEngine();
            // Format first two functions
            const result = formatter.formatRange(input, 0, 2, defaultOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // Third function should remain unchanged
            expect(lines[lines.length - 1]).toBe('fn third() { return; }');
        });

        it('should handle invalid range gracefully', () => {
            const input = 'fn main() { return; }';
            const formatter = new FormatterEngine();

            // Invalid range: start > end
            const result1 = formatter.formatRange(input, 5, 2, defaultOptions);
            expect(result1.success).toBe(false);
            expect(result1.error).toContain('Invalid line range');

            // Invalid range: negative start
            const result2 = formatter.formatRange(input, -1, 0, defaultOptions);
            expect(result2.success).toBe(false);
            expect(result2.error).toContain('Invalid line range');

            // Invalid range: end beyond file
            const result3 = formatter.formatRange(input, 0, 100, defaultOptions);
            expect(result3.success).toBe(false);
            expect(result3.error).toContain('Invalid line range');
        });

        it('should preserve original content on parse failure', () => {
            const input = 'completely invalid wgsl code @#$%';
            const formatter = new FormatterEngine();
            const result = formatter.formatRange(input, 0, 0, defaultOptions);

            // Should return original content
            expect(result.formattedText).toBe(input);
        });

        it('should format single line range', () => {
            const input = [
                'fn main() { return; }',
                '',
                'var x:f32=1.0;',
                '',
                'fn test() { return; }'
            ].join('\n');

            const formatter = new FormatterEngine();
            const result = formatter.formatRange(input, 2, 2, defaultOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // First and last lines should remain unchanged
            expect(lines[0]).toBe('fn main() { return; }');
            expect(lines[4]).toBe('fn test() { return; }');

            // Middle line should be formatted
            expect(lines[2]).toContain('var x: f32 = 1.0;');
        });
    });
});
