/**
 * Batch test: format all Prism WGSL files and report failures.
 */
import { describe, it, expect, vi } from 'vitest';

// Mock vscode module before importing formatter
vi.mock('vscode', () => ({
    window: {
        showErrorMessage: vi.fn(),
        showWarningMessage: vi.fn(),
    },
}));

import { FormatterEngine } from '../src/formatter';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const engine = new FormatterEngine();
const defaultOptions = {
    indentSize: 4,
    useTabs: false,
    insertFinalNewline: true,
    trimTrailingWhitespace: true,
    maxLineLength: 100,
    enableLineWrapping: true,
};

const prismDir = join(__dirname, 'prism');
const files = readdirSync(prismDir).filter(f => f.endsWith('.wgsl') && !f.endsWith('.out.wgsl'));

describe('Prism WGSL batch format test', () => {
    for (const file of files) {
        it(`formats ${file}`, () => {
            const source = readFileSync(join(prismDir, file), 'utf-8');
            const result = engine.format(source, defaultOptions);
            if (!result.success) {
                console.error(`\n❌ FAILED: ${file}`);
                console.error(`   Error: ${result.error}`);
            } else {
                console.log(`\n✅ PASSED: ${file}`);
            }
            expect(result.success, result.error).toBe(true);
        });
    }
});
