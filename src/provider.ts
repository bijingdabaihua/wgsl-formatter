/**
 * WGSL Formatting Provider - VSCode formatting provider implementation
 * Implements DocumentFormattingEditProvider and DocumentRangeFormattingEditProvider
 * Validates: Requirements 3.1, 5.1, 7.1, 7.2, 7.3, 8.3, 8.4
 */

import * as vscode from 'vscode';
import { FormatterEngine, FormatOptions } from './formatter';
import { ConfigurationManager } from './config';
import { getOutputChannel } from './extension';
import { logError, classifyError, getUserFriendlyMessage, showErrorNotification, showWarningNotification } from './errors';

/**
 * Performance thresholds for large file detection
 * Validates: Requirements 8.3, 8.4
 */
const LARGE_FILE_LINE_THRESHOLD = 5000; // Show progress for files > 5000 lines
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB memory limit

/**
 * WGSL Formatting Provider class
 * Provides document and range formatting capabilities for WGSL files
 */
export class WGSLFormattingProvider
    implements
    vscode.DocumentFormattingEditProvider,
    vscode.DocumentRangeFormattingEditProvider {
    private formatterEngine: FormatterEngine;
    private configManager: ConfigurationManager;
    private isFormatOnSaveActive: boolean = false;

    constructor(
        formatterEngine?: FormatterEngine,
        configManager?: ConfigurationManager
    ) {
        this.formatterEngine = formatterEngine || new FormatterEngine();
        this.configManager = configManager || new ConfigurationManager();

        // Listen for document save events to track format-on-save context
        vscode.workspace.onWillSaveTextDocument((event) => {
            const config = vscode.workspace.getConfiguration('editor', event.document);
            const formatOnSave = config.get<boolean>('formatOnSave', false);

            // Only track if this is a WGSL document and formatOnSave is enabled
            if (event.document.languageId === 'wgsl' && formatOnSave) {
                this.isFormatOnSaveActive = true;

                // Reset the flag after a short delay to ensure it's cleared
                setTimeout(() => {
                    this.isFormatOnSaveActive = false;
                }, 100);
            }
        });
    }

    /**
     * Check if format-on-save is currently active
     * Used to determine appropriate error handling behavior
     */
    private isFormatOnSave(): boolean {
        return this.isFormatOnSaveActive;
    }

    /**
     * Detect if a document is a large file
     * Validates: Requirements 8.3, 8.4
     * 
     * @param document The document to check
     * @returns True if the file exceeds size thresholds
     */
    private isLargeFile(document: vscode.TextDocument): boolean {
        const lineCount = document.lineCount;
        const byteSize = Buffer.byteLength(document.getText(), 'utf8');

        return lineCount > LARGE_FILE_LINE_THRESHOLD || byteSize > MAX_FILE_SIZE_BYTES;
    }

    /**
     * Format document with progress indication for large files
     * Validates: Requirements 8.3
     * 
     * @param document The document to format
     * @param options Formatting options
     * @param token Cancellation token
     * @returns Promise of text edits
     */
    private async formatWithProgress(
        document: vscode.TextDocument,
        options: FormatOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const source = document.getText();

        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Formatting WGSL file...',
                cancellable: true,
            },
            async (progress, progressToken) => {
                // Link the progress cancellation to the formatting cancellation
                progressToken.onCancellationRequested(() => {
                    // The token parameter will be checked in the formatting logic
                });

                // Check if either token is cancelled
                if (token.isCancellationRequested || progressToken.isCancellationRequested) {
                    return [];
                }

                progress.report({ increment: 30, message: 'Parsing...' });

                // Format the document
                const result = this.formatterEngine.format(source, options);

                // Check cancellation after formatting
                if (token.isCancellationRequested || progressToken.isCancellationRequested) {
                    return [];
                }

                progress.report({ increment: 70, message: 'Applying changes...' });

                // Handle formatting result
                if (!result.success) {
                    const outputChannel = getOutputChannel();
                    if (outputChannel && result.error) {
                        const errorType = classifyError(new Error(result.error));
                        const timestamp = new Date().toISOString();
                        const isFormatOnSave = this.isFormatOnSave();
                        const level = isFormatOnSave ? 'WARNING' : 'ERROR';

                        outputChannel.appendLine(`[${timestamp}] ${level}: Formatting failed:`);
                        outputChannel.appendLine(`Error Type: ${errorType}`);
                        outputChannel.appendLine(`Message: ${result.error}`);
                        if (isFormatOnSave) {
                            outputChannel.appendLine('Note: File was saved without formatting');
                        }
                        outputChannel.appendLine('');

                        const friendlyMessage = getUserFriendlyMessage(errorType, result.error);
                        if (isFormatOnSave) {
                            showWarningNotification(friendlyMessage, outputChannel);
                        } else {
                            showErrorNotification(friendlyMessage, outputChannel);
                        }
                    }
                    return [];
                }

                // Create text edit
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(source.length)
                );

                return [vscode.TextEdit.replace(fullRange, result.formattedText)];
            }
        );
    }

    /**
     * Provide formatting edits for an entire document
     * Validates: Requirements 3.1, 7.1, 7.2, 7.3, 8.3
     * 
     * @param document The document to format
     * @param options Formatting options from VSCode
     * @param token Cancellation token
     * @returns Array of text edits or undefined if cancelled/failed
     */
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        // Check cancellation before starting
        if (token.isCancellationRequested) {
            return undefined;
        }

        // Get formatting configuration
        const formatOptions = this.getFormatOptions(options);

        // Check if this is a large file and use progress indication
        // Validates: Requirement 8.3
        if (this.isLargeFile(document)) {
            return this.formatWithProgress(document, formatOptions, token);
        }

        // For normal-sized files, format without progress indication
        try {
            // Get the full document text
            const source = document.getText();

            // Check cancellation before formatting
            if (token.isCancellationRequested) {
                return undefined;
            }

            // Format the document
            const result = this.formatterEngine.format(source, formatOptions);

            // Check cancellation after formatting
            if (token.isCancellationRequested) {
                return undefined;
            }

            // If formatting failed, log error and return empty array (no changes)
            // Validates: Requirements 7.1, 7.2, 7.4, 6.3
            if (!result.success) {
                const outputChannel = getOutputChannel();
                if (outputChannel && result.error) {
                    const errorType = classifyError(new Error(result.error));
                    const timestamp = new Date().toISOString();

                    // For format-on-save, use warning level; otherwise use error level
                    const isFormatOnSave = this.isFormatOnSave();
                    const level = isFormatOnSave ? 'WARNING' : 'ERROR';

                    outputChannel.appendLine(`[${timestamp}] ${level}: Formatting failed:`);
                    outputChannel.appendLine(`Error Type: ${errorType}`);
                    outputChannel.appendLine(`Message: ${result.error}`);
                    if (isFormatOnSave) {
                        outputChannel.appendLine('Note: File was saved without formatting');
                    }
                    outputChannel.appendLine('');

                    // Show user notification with option to view details
                    // Validates: Requirements 1.4, 7.1, 7.2, 6.3
                    const friendlyMessage = getUserFriendlyMessage(errorType, result.error);

                    // For format-on-save, show warning; for manual format, show error
                    if (isFormatOnSave) {
                        showWarningNotification(friendlyMessage, outputChannel);
                    } else {
                        showErrorNotification(friendlyMessage, outputChannel);
                    }
                }
                return [];
            }

            // Create a text edit that replaces the entire document
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(source.length)
            );

            return [vscode.TextEdit.replace(fullRange, result.formattedText)];
        } catch (error) {
            // Log error to output channel
            // Validates: Requirements 1.4, 7.1, 7.2, 6.3
            const outputChannel = getOutputChannel();
            const isFormatOnSave = this.isFormatOnSave();

            if (outputChannel) {
                const timestamp = new Date().toISOString();
                const level = isFormatOnSave ? 'WARNING' : 'ERROR';
                const contextStr = isFormatOnSave ? ' (during save)' : '';

                outputChannel.appendLine(`[${timestamp}] ${level}${contextStr}:`);
                logError(error, outputChannel, 'document formatting');

                if (isFormatOnSave) {
                    outputChannel.appendLine('Note: File was saved without formatting');
                    outputChannel.appendLine('');
                }
            }

            // Show user notification with option to view details
            const errorType = classifyError(error);
            const friendlyMessage = getUserFriendlyMessage(errorType);

            // For format-on-save, show warning; for manual format, show error
            if (isFormatOnSave) {
                showWarningNotification(friendlyMessage, outputChannel);
            } else {
                showErrorNotification(friendlyMessage, outputChannel);
            }

            // Return empty array to preserve original content
            // Validates: Requirement 6.3 - allow file to save normally
            return [];
        }
    }


    /**
     * Provide formatting edits for a selected range
     * Validates: Requirements 5.1, 7.1, 7.2, 7.3
     * 
     * @param document The document to format
     * @param range The range to format
     * @param options Formatting options from VSCode
     * @param token Cancellation token
     * @returns Array of text edits or undefined if cancelled/failed
     */
    provideDocumentRangeFormattingEdits(
        document: vscode.TextDocument,
        range: vscode.Range,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        // Check cancellation before starting
        if (token.isCancellationRequested) {
            return undefined;
        }

        try {
            // Get the full document text
            const source = document.getText();

            // Get formatting configuration
            const formatOptions = this.getFormatOptions(options);

            // Convert VSCode range to line numbers (0-indexed)
            const startLine = range.start.line;
            const endLine = range.end.line;

            // Check cancellation before formatting
            if (token.isCancellationRequested) {
                return undefined;
            }

            // Format the range
            const result = this.formatterEngine.formatRange(
                source,
                startLine,
                endLine,
                formatOptions
            );

            // Check cancellation after formatting
            if (token.isCancellationRequested) {
                return undefined;
            }

            // If formatting failed, log error and return empty array (no changes)
            // Validates: Requirements 7.1, 7.2, 7.4
            if (!result.success) {
                const outputChannel = getOutputChannel();
                if (outputChannel && result.error) {
                    const errorType = classifyError(new Error(result.error));
                    const timestamp = new Date().toISOString();
                    outputChannel.appendLine(`[${timestamp}] Range formatting failed:`);
                    outputChannel.appendLine(`Error Type: ${errorType}`);
                    outputChannel.appendLine(`Message: ${result.error}`);
                    outputChannel.appendLine('');

                    // Show user notification with option to view details
                    // Validates: Requirements 1.4, 7.1, 7.2
                    const friendlyMessage = getUserFriendlyMessage(errorType, result.error);
                    showErrorNotification(friendlyMessage, outputChannel);
                }
                return [];
            }

            // Create a text edit that replaces the entire document
            // (formatRange returns the full document with only the range formatted)
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(source.length)
            );

            return [vscode.TextEdit.replace(fullRange, result.formattedText)];
        } catch (error) {
            // Log error to output channel
            // Validates: Requirements 1.4, 7.1, 7.2
            const outputChannel = getOutputChannel();
            logError(error, outputChannel, 'range formatting');

            // Show user notification with option to view details
            const errorType = classifyError(error);
            const friendlyMessage = getUserFriendlyMessage(errorType);
            showErrorNotification(friendlyMessage, outputChannel);

            // Return empty array to preserve original content
            return [];
        }
    }

    /**
     * Convert VSCode formatting options to formatter options
     * Integrates with ConfigurationManager to get user preferences
     * 
     * @param vscodeOptions VSCode formatting options
     * @returns Formatter options
     */
    private getFormatOptions(vscodeOptions: vscode.FormattingOptions): FormatOptions {
        // Get user configuration
        const config = this.configManager.getConfig();

        // Determine useTabs based on VSCode options or config
        // If insertSpaces is explicitly set, use it; otherwise fall back to config
        let useTabs = config.useTabs;
        if (vscodeOptions.insertSpaces !== undefined) {
            useTabs = !vscodeOptions.insertSpaces;
        }

        // Merge VSCode options with user configuration
        // VSCode options take precedence for indent settings if provided
        return {
            indentSize: vscodeOptions.tabSize || config.indentSize,
            useTabs,
            insertFinalNewline: config.insertFinalNewline,
            trimTrailingWhitespace: config.trimTrailingWhitespace,
        };
    }
}
