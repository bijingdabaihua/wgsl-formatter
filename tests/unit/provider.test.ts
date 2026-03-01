/**
 * Unit tests for WGSLFormattingProvider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { WGSLFormattingProvider } from '../../src/provider';
import { FormatterEngine, FormatResult, FormatOptions } from '../../src/formatter';
import { ConfigurationManager, FormattingConfig } from '../../src/config';

// Mock vscode module
vi.mock('vscode', () => {
    class Position {
        constructor(public line: number, public character: number) { }
        isBefore() { return false; }
        isBeforeOrEqual() { return false; }
        isAfter() { return false; }
        isAfterOrEqual() { return false; }
        isEqual() { return false; }
        compareTo() { return 0; }
        translate() { return this; }
        with() { return this; }
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
        },
    };
});

describe('WGSLFormattingProvider', () => {
    let provider: WGSLFormattingProvider;
    let mockFormatterEngine: FormatterEngine;
    let mockConfigManager: ConfigurationManager;
    let mockDocument: vscode.TextDocument;
    let mockToken: vscode.CancellationToken;

    beforeEach(() => {
        // Create mock formatter engine
        mockFormatterEngine = {
            format: vi.fn(),
            formatRange: vi.fn(),
        } as any;

        // Create mock config manager
        mockConfigManager = {
            getConfig: vi.fn().mockReturnValue({
                indentSize: 4,
                useTabs: false,
                insertFinalNewline: true,
                trimTrailingWhitespace: true,
            }),
            onConfigChange: vi.fn(),
        } as any;

        // Create provider with mocks
        provider = new WGSLFormattingProvider(mockFormatterEngine, mockConfigManager);

        // Create mock document
        mockDocument = {
            getText: vi.fn().mockReturnValue('fn main() { return; }'),
            positionAt: vi.fn((offset: number) => ({
                line: 0,
                character: offset,
            })),
        } as any;

        // Create mock cancellation token
        mockToken = {
            isCancellationRequested: false,
            onCancellationRequested: vi.fn(),
        } as any;
    });

    describe('provideDocumentFormattingEdits', () => {
        it('should format entire document successfully', () => {
            // Setup
            const formattedText = 'fn main() {\n    return;\n}\n';
            (mockFormatterEngine.format as any).mockReturnValue({
                formattedText,
                success: true,
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Verify
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect((result as any)[0].newText).toBe(formattedText);
            expect(mockFormatterEngine.format).toHaveBeenCalledWith(
                'fn main() { return; }',
                expect.objectContaining({
                    indentSize: 4,
                    useTabs: false,
                })
            );
        });

        it('should return empty array when formatting fails', () => {
            // Setup
            (mockFormatterEngine.format as any).mockReturnValue({
                formattedText: 'fn main() { return; }',
                success: false,
                error: 'Parse error',
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Verify
            expect(result).toEqual([]);
        });

        it('should return undefined when cancelled before formatting', () => {
            // Setup
            mockToken.isCancellationRequested = true;

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Verify
            expect(result).toBeUndefined();
            expect(mockFormatterEngine.format).not.toHaveBeenCalled();
        });

        it('should return undefined when cancelled after formatting', () => {
            // Setup
            (mockFormatterEngine.format as any).mockImplementation(() => {
                mockToken.isCancellationRequested = true;
                return {
                    formattedText: 'fn main() {\n    return;\n}\n',
                    success: true,
                };
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Verify
            expect(result).toBeUndefined();
        });

        it('should handle exceptions gracefully', () => {
            // Setup
            (mockFormatterEngine.format as any).mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentFormattingEdits(
                mockDocument,
                options,
                mockToken
            );

            // Verify
            expect(result).toEqual([]);
        });

        it('should use tabs when insertSpaces is false', () => {
            // Setup
            (mockFormatterEngine.format as any).mockReturnValue({
                formattedText: 'fn main() {\n\treturn;\n}\n',
                success: true,
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: false,
            };

            // Execute
            provider.provideDocumentFormattingEdits(mockDocument, options, mockToken);

            // Verify
            expect(mockFormatterEngine.format).toHaveBeenCalledWith(
                'fn main() { return; }',
                expect.objectContaining({
                    useTabs: true,
                })
            );
        });
    });

    describe('provideDocumentRangeFormattingEdits', () => {
        it('should format selected range successfully', () => {
            // Setup
            const formattedText = 'fn main() {\n    return;\n}\n';
            (mockFormatterEngine.formatRange as any).mockReturnValue({
                formattedText,
                success: true,
            });

            const range = new vscode.Range(
                new (vscode as any).Position(0, 0),
                new (vscode as any).Position(2, 0)
            );

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentRangeFormattingEdits(
                mockDocument,
                range,
                options,
                mockToken
            );

            // Verify
            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(1);
            expect((result as any)[0].newText).toBe(formattedText);
            expect(mockFormatterEngine.formatRange).toHaveBeenCalledWith(
                'fn main() { return; }',
                0,
                2,
                expect.objectContaining({
                    indentSize: 4,
                    useTabs: false,
                })
            );
        });

        it('should return empty array when range formatting fails', () => {
            // Setup
            (mockFormatterEngine.formatRange as any).mockReturnValue({
                formattedText: 'fn main() { return; }',
                success: false,
                error: 'Invalid range',
            });

            const range = new vscode.Range(
                new (vscode as any).Position(0, 0),
                new (vscode as any).Position(2, 0)
            );

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentRangeFormattingEdits(
                mockDocument,
                range,
                options,
                mockToken
            );

            // Verify
            expect(result).toEqual([]);
        });

        it('should return undefined when cancelled before formatting', () => {
            // Setup
            mockToken.isCancellationRequested = true;

            const range = new vscode.Range(
                new (vscode as any).Position(0, 0),
                new (vscode as any).Position(2, 0)
            );

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentRangeFormattingEdits(
                mockDocument,
                range,
                options,
                mockToken
            );

            // Verify
            expect(result).toBeUndefined();
            expect(mockFormatterEngine.formatRange).not.toHaveBeenCalled();
        });

        it('should handle exceptions gracefully', () => {
            // Setup
            (mockFormatterEngine.formatRange as any).mockImplementation(() => {
                throw new Error('Unexpected error');
            });

            const range = new vscode.Range(
                new (vscode as any).Position(0, 0),
                new (vscode as any).Position(2, 0)
            );

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            const result = provider.provideDocumentRangeFormattingEdits(
                mockDocument,
                range,
                options,
                mockToken
            );

            // Verify
            expect(result).toEqual([]);
        });
    });

    describe('configuration integration', () => {
        it('should use configuration from ConfigurationManager', () => {
            // Setup
            (mockConfigManager.getConfig as any).mockReturnValue({
                indentSize: 2,
                useTabs: true,
                insertFinalNewline: false,
                trimTrailingWhitespace: false,
            });

            (mockFormatterEngine.format as any).mockReturnValue({
                formattedText: 'fn main() {\n\treturn;\n}',
                success: true,
            });

            const options: vscode.FormattingOptions = {
                tabSize: 4,
                insertSpaces: true,
            };

            // Execute
            provider.provideDocumentFormattingEdits(mockDocument, options, mockToken);

            // Verify - VSCode options should take precedence for indent settings
            expect(mockFormatterEngine.format).toHaveBeenCalledWith(
                'fn main() { return; }',
                expect.objectContaining({
                    indentSize: 4, // From VSCode options
                    useTabs: false, // From VSCode options (insertSpaces: true)
                    insertFinalNewline: false, // From config
                    trimTrailingWhitespace: false, // From config
                })
            );
        });

        it('should fall back to config when VSCode options are not provided', () => {
            // Setup
            (mockConfigManager.getConfig as any).mockReturnValue({
                indentSize: 2,
                useTabs: true,
                insertFinalNewline: false,
                trimTrailingWhitespace: false,
            });

            (mockFormatterEngine.format as any).mockReturnValue({
                formattedText: 'fn main() {\n\treturn;\n}',
                success: true,
            });

            // Don't provide tabSize or insertSpaces to test fallback
            const options: vscode.FormattingOptions = {
                tabSize: undefined as any,
                insertSpaces: undefined as any,
            };

            // Execute
            provider.provideDocumentFormattingEdits(mockDocument, options, mockToken);

            // Verify - Should use config values
            expect(mockFormatterEngine.format).toHaveBeenCalledWith(
                'fn main() { return; }',
                expect.objectContaining({
                    indentSize: 2, // From config
                    useTabs: true, // From config
                    insertFinalNewline: false, // From config
                    trimTrailingWhitespace: false, // From config
                })
            );
        });
    });
});
