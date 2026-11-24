/**
 * Auto-discovered formatter test suite.
 * Reads every `tests/*.in.wgsl` + `tests/*.out.wgsl` pair and asserts exact match.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

// Mock vscode module before importing formatter
vi.mock('vscode', () => ({
    window: {
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
    },
}));

import { FormatterEngine } from '../src/formatter';

const engine = new FormatterEngine();
const defaultOptions = {
    indentSize: 4,
    useTabs: false,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    maxLineLength: 100,
    enableLineWrapping: true,
};

const testsDir = __dirname;

// Collect all .in.wgsl files (excluding prism/ subdir)
const inFiles = readdirSync(testsDir)
    .filter((f) => f.endsWith('.in.wgsl'))
    .sort();

describe('Formatter pair tests', () => {
    for (const inFile of inFiles) {
        const base = basename(inFile, '.in.wgsl');
        const outFile = `${base}.out.wgsl`;

        it(`${base}`, () => {
            const source = readFileSync(join(testsDir, inFile), 'utf-8');
            const expected = readFileSync(join(testsDir, outFile), 'utf-8');

            const result = engine.format(source, defaultOptions);
            expect(result.success, result.error).toBe(true);

            if (result.success) {
                // Normalize trailing newline for comparison (test files may or may not have one)
                const actual = result.formattedText.replace(/\r\n/g, '\n').replace(/\n+$/, '\n');
                const exp = expected.replace(/\r\n/g, '\n').replace(/\n+$/, '\n');
                expect(actual).toBe(exp);
            }
        });
    }
});
