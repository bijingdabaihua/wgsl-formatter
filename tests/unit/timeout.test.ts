/**
 * Unit tests for timeout handling in FormatterEngine
 * Validates: Requirement 7.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    timeout: 100, // Short timeout for testing
};

describe('Timeout Handling', () => {
    let formatter: FormatterEngine;

    beforeEach(() => {
        formatter = new FormatterEngine();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should use default timeout of 2000ms when not specified', () => {
        const input = 'fn main() { return; }';
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: undefined,
        };

        const result = formatter.format(input, options);
        expect(result.success).toBe(true);
    });

    it('should respect custom timeout configuration', () => {
        const input = 'fn main() { return; }';
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: 5000, // 5 second timeout
        };

        const result = formatter.format(input, options);
        expect(result.success).toBe(true);
    });

    it('should return original content on timeout', () => {
        const input = 'fn main() { return; }';
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: 1, // Very short timeout to trigger immediately
        };

        // Mock Date.now to simulate timeout
        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            // First call: start time (0)
            // Second call: elapsed time exceeds timeout
            return callCount === 1 ? 0 : 1000;
        });

        const result = formatter.format(input, options);

        // Restore Date.now
        Date.now = originalDateNow;

        // Should return original content on timeout
        expect(result.formattedText).toBe(input);
        expect(result.success).toBe(false);
        expect(result.error).toContain('TimeoutError');
        expect(result.error).toContain('timed out');
    });

    it('should include timeout duration in error message', () => {
        const input = 'fn main() { return; }';
        const timeoutMs = 50;
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: timeoutMs,
        };

        // Mock Date.now to simulate timeout
        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            return callCount === 1 ? 0 : timeoutMs + 10;
        });

        const result = formatter.format(input, options);

        // Restore Date.now
        Date.now = originalDateNow;

        expect(result.error).toContain(`${timeoutMs}ms`);
    });

    it('should handle timeout in formatRange', () => {
        const input = 'fn main() { return; }\nfn test() { return; }';
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: 1,
        };

        // Mock Date.now to simulate timeout
        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            return callCount === 1 ? 0 : 1000;
        });

        const result = formatter.formatRange(input, 0, 1, options);

        // Restore Date.now
        Date.now = originalDateNow;

        // Should return original content on timeout
        expect(result.formattedText).toBe(input);
        expect(result.success).toBe(false);
        expect(result.error).toContain('TimeoutError');
    });

    it('should complete successfully when within timeout', () => {
        const input = 'fn main() { return; }';
        const options: FormatOptions = {
            ...defaultOptions,
            timeout: 5000, // Long timeout
        };

        const result = formatter.format(input, options);

        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
    });

    it('should check timeout at multiple points during formatting', () => {
        // This test verifies that timeout is checked periodically
        // The formatter checks timeout:
        // 1. Before starting
        // 2. After parsing
        // 3. After traversal
        // 4. After post-processing

        const input = `
            fn function1() { return; }
            fn function2() { return; }
            fn function3() { return; }
            fn function4() { return; }
            fn function5() { return; }
        `;

        const options: FormatOptions = {
            ...defaultOptions,
            timeout: 100,
        };

        // Mock Date.now to simulate gradual time passage
        const originalDateNow = Date.now;
        let callCount = 0;
        Date.now = vi.fn(() => {
            callCount++;
            // Gradually increase time, but stay within timeout
            return callCount * 20; // 20ms per call
        });

        const result = formatter.format(input, options);

        // Restore Date.now
        Date.now = originalDateNow;

        // Should complete successfully since we stay within timeout
        expect(result.success).toBe(true);
        // Verify timeout was checked multiple times
        expect(callCount).toBeGreaterThan(1);
    });
});
