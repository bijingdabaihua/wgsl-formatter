/**
 * Unit tests for Line Wrapping functionality
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

describe('Line Wrapping', () => {
    const defaultOptions: FormatOptions = {
        indentSize: 4,
        useTabs: false,
        insertFinalNewline: true,
        trimTrailingWhitespace: true,
        maxLineLength: 60,
        enableLineWrapping: true,
    };

    describe('Function signature wrapping', () => {
        it('should wrap long function signatures', () => {
            const formatter = new FormatterEngine();
            const source = 'fn computeShading(position: vec3<f32>, normal: vec3<f32>, lightDir: vec3<f32>) -> vec3<f32> { return position; }';

            const result = formatter.format(source, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.formattedText).toContain('fn computeShading(');
            expect(result.formattedText).toContain('    position: vec3<f32>,');
            expect(result.formattedText).toContain('    normal: vec3<f32>,');
            expect(result.formattedText).toContain('    lightDir: vec3<f32>');
            expect(result.formattedText).toContain(') -> vec3<f32>');
        });

        it('should not wrap short function signatures', () => {
            const formatter = new FormatterEngine();
            const source = 'fn add(a: f32, b: f32) -> f32 { return a; }';

            const result = formatter.format(source, defaultOptions);

            expect(result.success).toBe(true);
            expect(result.formattedText).toContain('fn add(a: f32, b: f32) -> f32 {');
        });

        it('should respect enableLineWrapping configuration', () => {
            const formatter = new FormatterEngine();
            const source = 'fn computeShading(position: vec3<f32>, normal: vec3<f32>, lightDir: vec3<f32>) -> vec3<f32> { return position; }';

            const optionsNoWrap: FormatOptions = {
                ...defaultOptions,
                enableLineWrapping: false,
            };

            const result = formatter.format(source, optionsNoWrap);

            expect(result.success).toBe(true);
            // Should be on one line (or at least not wrapped by our rule)
            const lines = result.formattedText.split('\n').filter(l => l.trim().length > 0);
            // The function signature should be on fewer lines when wrapping is disabled
            expect(lines.length).toBeLessThan(6);
        });
    });

    describe('Line length limits', () => {
        it('should respect maxLineLength configuration', () => {
            const formatter = new FormatterEngine();
            const source = 'fn test() -> f32 { return 1.0; }';

            const shortLineOptions: FormatOptions = {
                ...defaultOptions,
                maxLineLength: 30,
            };

            const result = formatter.format(source, shortLineOptions);

            expect(result.success).toBe(true);
            const lines = result.formattedText.split('\n');

            // Most lines should respect the limit (allowing for some exceptions)
            const longLines = lines.filter(l => l.length > shortLineOptions.maxLineLength);
            const totalLines = lines.filter(l => l.trim().length > 0).length;

            // At least 80% of lines should be within the limit
            expect(longLines.length / totalLines).toBeLessThan(0.2);
        });

        it('should handle different maxLineLength values', () => {
            const formatter = new FormatterEngine();
            const source = 'fn computeShading(position: vec3<f32>, normal: vec3<f32>) -> vec3<f32> { return position; }';

            const options80: FormatOptions = { ...defaultOptions, maxLineLength: 80 };
            const options100: FormatOptions = { ...defaultOptions, maxLineLength: 100 };

            const result80 = formatter.format(source, options80);
            const result100 = formatter.format(source, options100);

            expect(result80.success).toBe(true);
            expect(result100.success).toBe(true);

            // With longer max length, we should have fewer lines
            const lines80 = result80.formattedText.split('\n').filter(l => l.trim().length > 0);
            const lines100 = result100.formattedText.split('\n').filter(l => l.trim().length > 0);

            expect(lines100.length).toBeLessThanOrEqual(lines80.length);
        });
    });

    describe('Idempotence', () => {
        it('should produce identical results when formatting twice', () => {
            const formatter = new FormatterEngine();
            const source = 'fn computeShading(position: vec3<f32>, normal: vec3<f32>, lightDir: vec3<f32>) -> vec3<f32> { return position; }';

            const result1 = formatter.format(source, defaultOptions);
            const result2 = formatter.format(result1.formattedText, defaultOptions);

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result2.formattedText).toBe(result1.formattedText);
        });
    });

    describe('Error handling', () => {
        it('should handle syntax errors gracefully', () => {
            const formatter = new FormatterEngine();
            const source = 'fn invalid( { syntax error }';

            const result = formatter.format(source, defaultOptions);

            expect(result.success).toBe(false);
            expect(result.formattedText).toBe(source); // Original content preserved
        });
    });
});
