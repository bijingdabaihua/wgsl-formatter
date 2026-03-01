/**
 * End-to-End Integration Tests
 * Tests the complete formatting flow from VSCode API to formatted output
 * Validates: Requirements 1.1, 1.2, 3.1, and all requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as vscode from 'vscode';
import { WGSLFormattingProvider } from '../../src/provider';
import { FormatterEngine } from '../../src/formatter';
import { ConfigurationManager } from '../../src/config';

// Mock vscode module
vi.mock('vscode', () => {
    class Position {
        constructor(public line: number, public character: number) { }
    }

    return {
        Position,
        Range: class Range {
            constructor(
                public start: Position,
                public end: Position
            ) { }
        },
        TextEdit: {
            replace: (range: any, newText: string) => ({ range, newText }),
        },
        CancellationTokenSource: class CancellationTokenSource {
            token = {
                isCancellationRequested: false,
                onCancellationRequested: vi.fn(),
            };
            cancel() {
                this.token.isCancellationRequested = true;
            }
            dispose() { }
        },
        ProgressLocation: {
            Notification: 15,
        },
        workspace: {
            onWillSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
            getConfiguration: vi.fn(() => ({
                get: vi.fn((key: string, defaultValue?: any) => defaultValue),
            })),
        },
        window: {
            createOutputChannel: vi.fn(() => ({
                appendLine: vi.fn(),
                show: vi.fn(),
            })),
            showErrorMessage: vi.fn(() => Promise.resolve(undefined)),
            showWarningMessage: vi.fn(() => Promise.resolve(undefined)),
            withProgress: vi.fn((options, task) => task({ report: vi.fn() }, { isCancellationRequested: false, onCancellationRequested: vi.fn() })),
        },
    };
});

describe('End-to-End Integration Tests', () => {
    let provider: WGSLFormattingProvider;
    let formatterEngine: FormatterEngine;
    let configManager: ConfigurationManager;
    let mockDocument: vscode.TextDocument;
    let mockToken: vscode.CancellationToken;

    beforeEach(() => {
        formatterEngine = new FormatterEngine();
        configManager = new ConfigurationManager();
        provider = new WGSLFormattingProvider(formatterEngine, configManager);

        mockToken = {
            isCancellationRequested: false,
            onCancellationRequested: vi.fn(),
        } as any;
    });

    describe('Complete Formatting Flow', () => {
        it('should format a complete WGSL shader from start to finish', () => {
            // Validates: Requirements 1.1, 1.2, 3.1, 3.2, 4.1-4.7
            const input = `fn vertexMain(){var x:f32=1.0;return;}
fn fragmentMain(){var y:f32=2.0+3.0;return;}`;

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: input.split('\n').length,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);

            const formattedText = (result as any)[0].newText;

            // Verify formatting rules applied
            expect(formattedText).toContain('fn vertexMain');
            expect(formattedText).toContain('fn fragmentMain');

            // Verify spacing around operators
            expect(formattedText).toContain('2.0 + 3.0');
            expect(formattedText).toContain('var x: f32 = 1.0');

            // Verify indentation
            expect(formattedText).toMatch(/\n    /); // 4-space indentation

            // Verify final newline
            expect(formattedText).toMatch(/\n$/);
        });

        it('should handle configuration changes end-to-end', () => {
            // Validates: Requirements 9.1, 9.2, 9.3
            const input = 'fn main(){return;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            // Test with spaces (default)
            let options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            let result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            let formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('    '); // 4 spaces

            // Test with tabs
            options = {
                tabSize: 4,
                insertSpaces: false,
            };

            result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('\t'); // Tab character

            // Test with different indent size
            options = {
                tabSize: 2,
                insertSpaces: true,
            };

            result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('  return'); // 2 spaces
        });

        it('should handle range formatting end-to-end', () => {
            // Validates: Requirements 5.1, 5.2, 5.3
            const input = [
                'fn first(){return;}',
                '',
                'fn second(){return;}',
                '',
                'fn third(){return;}'
            ].join('\n');

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 5,
                languageId: 'wgsl',
            } as any;

            const range = new vscode.Range(
                new (vscode as any).Position(2, 0),
                new (vscode as any).Position(2, 20)
            );

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentRangeFormattingEdits(
                mockDocument,
                range,
                options,
                mockToken
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);

            const formattedText = (result as any)[0].newText;
            const lines = formattedText.split('\n');

            // First and last functions should remain unchanged
            expect(lines[0]).toBe('fn first(){return;}');
            expect(lines[4]).toBe('fn third(){return;}');

            // Middle function should be formatted
            expect(lines[2]).toContain('fn second()');
        });
    });

    describe('Error Handling End-to-End', () => {
        it('should handle syntax errors gracefully throughout the flow', () => {
            // Validates: Requirements 3.4, 7.1, 7.4
            const input = 'fn main( { invalid syntax }';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Should return empty array (no changes)
            expect(result).toEqual([]);
        });

        it('should handle cancellation throughout the flow', () => {
            // Validates: Requirement 7.3
            const input = 'fn main() { return; }';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            // Cancel before formatting
            mockToken.isCancellationRequested = true;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Should return undefined when cancelled
            expect(result).toBeUndefined();
        });

        it('should handle internal errors throughout the flow', () => {
            // Validates: Requirements 7.2, 7.4
            const input = 'fn main() { return; }';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            // Mock the formatter engine to throw an error
            const originalFormat = formatterEngine.format;
            formatterEngine.format = vi.fn().mockImplementation(() => {
                throw new Error('Unexpected internal error');
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Should return empty array (no changes)
            expect(result).toEqual([]);

            // Restore original method
            formatterEngine.format = originalFormat;
        });
    });

    describe('Configuration Integration End-to-End', () => {
        it('should apply configuration changes immediately', () => {
            // Validates: Requirement 9.3
            const input = 'fn main(){return;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            // First format with default config
            let options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            let result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            let formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('    '); // 4 spaces

            // Change configuration
            options = {
                tabSize: 2,
                insertSpaces: true,
            };

            // Format again with new config
            result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('  return'); // 2 spaces
        });

        it('should use default configuration when no user settings exist', () => {
            // Validates: Requirements 1.3, 9.4
            const input = 'fn main(){return;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);

            const formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('fn main()');
            expect(formattedText).toContain('    return'); // Default 4 spaces
        });
    });

    describe('Cross-Platform Compatibility End-to-End', () => {
        it('should preserve CRLF newlines on Windows', () => {
            // Validates: Requirement 10.5
            const input = 'fn main() {\r\n    return;\r\n}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 3,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            const formattedText = (result as any)[0].newText;

            // Should preserve CRLF
            expect(formattedText).toContain('\r\n');
            expect(formattedText).not.toMatch(/[^\r]\n/); // No LF without CR
        });

        it('should preserve LF newlines on Unix/Mac', () => {
            // Validates: Requirement 10.5
            const input = 'fn main() {\n    return;\n}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 3,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            const formattedText = (result as any)[0].newText;

            // Should preserve LF
            expect(formattedText).toContain('\n');
            expect(formattedText).not.toContain('\r\n'); // No CRLF
        });
    });

    describe('Performance and Large Files End-to-End', () => {
        it('should handle large files with progress indication', async () => {
            // Validates: Requirement 8.3
            // Generate a large file (> 5000 lines)
            const lines: string[] = [];
            for (let i = 0; i < 6000; i++) {
                lines.push(`fn func${i}() { return; }`);
            }
            const input = lines.join('\n');

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 6000,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const result = await provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Should still format successfully
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);

            // Verify withProgress was called
            expect(vscode.window.withProgress).toHaveBeenCalled();
        });

        it('should format small files quickly without progress indication', () => {
            // Validates: Requirement 8.1
            const input = 'fn main() { return; }';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            const startTime = Date.now();
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );
            const elapsed = Date.now() - startTime;

            // Should complete quickly (< 500ms for small files)
            expect(elapsed).toBeLessThan(500);
            expect(result).toBeDefined();
        });
    });

    describe('Complete Workflow Scenarios', () => {
        it('should handle a complete shader development workflow', () => {
            // Validates: All requirements in a realistic scenario
            // Step 1: Start with unformatted code
            let input = 'fn process()->f32{return 1.0+2.0;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Step 2: Format the document
            let result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result!.length).toBeGreaterThan(0);

            let formattedText = (result as any)[0].newText;

            // Step 3: Verify formatting applied
            expect(formattedText).toContain('fn process');
            expect(formattedText).toContain('1.0 + 2.0'); // Spacing around operators

            // Step 4: Add more code and format again
            input = formattedText + '\nfn another(){return;}';
            mockDocument.getText = vi.fn().mockReturnValue(input);
            mockDocument.lineCount = input.split('\n').length;

            result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            formattedText = (result as any)[0].newText;

            // Step 5: Verify both functions are formatted
            expect(formattedText).toContain('fn process');
            expect(formattedText).toContain('fn another()');
        });

        it('should handle format-on-save workflow', () => {
            // Validates: Requirements 6.1, 6.2, 6.3
            const input = 'fn main(){return;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Simulate format-on-save
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);

            const formattedText = (result as any)[0].newText;
            expect(formattedText).toContain('fn main()');
            expect(formattedText).toContain('    return'); // Formatted
        });

        it('should handle multiple formatting operations in sequence', () => {
            // Validates: Idempotence and consistency
            const input = 'fn main(){var x:f32=1.0+2.0;return;}';

            mockDocument = {
                getText: vi.fn().mockReturnValue(input),
                positionAt: vi.fn((offset: number) => ({
                    line: 0,
                    character: offset,
                })),
                lineCount: 1,
                languageId: 'wgsl',
            } as any;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // First format
            let result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            const firstFormatted = (result as any)[0].newText;

            // Second format (should be idempotent)
            mockDocument.getText = vi.fn().mockReturnValue(firstFormatted);
            result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            const secondFormatted = (result as any)[0].newText;

            // Should produce identical results
            expect(secondFormatted).toBe(firstFormatted);
        });
    });
});
