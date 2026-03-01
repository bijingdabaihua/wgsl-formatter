/**
 * Configuration Manager - Manages extension configuration
 */

import * as vscode from 'vscode';

/**
 * Formatting configuration interface
 * Validates: Requirements 9.1, 9.2, 9.4, 11.1, 11.2
 */
export interface FormattingConfig {
    indentSize: number;
    useTabs: boolean;
    insertFinalNewline: boolean;
    trimTrailingWhitespace: boolean;
    maxLineLength: number;
    enableLineWrapping: boolean;
}

/**
 * Configuration Manager class
 * Manages extension configuration and provides change notifications
 */
export class ConfigurationManager {
    /**
     * Get current formatting configuration
     * Reads from VSCode workspace configuration and applies defaults
     * Validates: Requirements 9.1, 9.2, 9.4, 11.1, 11.2
     */
    getConfig(): FormattingConfig {
        const config = vscode.workspace.getConfiguration('wgslFormatter');
        const editorConfig = vscode.workspace.getConfiguration('editor');

        // Read extension-specific configuration with defaults
        const indentSize = config.get<number>('indentSize', 4);
        const useTabs = config.get<boolean>('useTabs', false);
        const maxLineLength = config.get<number>('maxLineLength', 100);
        const enableLineWrapping = config.get<boolean>('enableLineWrapping', true);

        // Inherit editor configuration
        const insertFinalNewline = editorConfig.get<boolean>('insertFinalNewline', true);
        const trimTrailingWhitespace = editorConfig.get<boolean>('trimTrailingWhitespace', true);

        return {
            indentSize,
            useTabs,
            insertFinalNewline,
            trimTrailingWhitespace,
            maxLineLength,
            enableLineWrapping,
        };
    }

    /**
     * Register a callback for configuration changes
     * Validates: Requirement 9.3
     * 
     * @param callback Function to call when configuration changes
     * @returns Disposable to unregister the callback
     */
    onConfigChange(callback: (config: FormattingConfig) => void): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration((event) => {
            // Check if relevant configuration changed
            if (
                event.affectsConfiguration('wgslFormatter') ||
                event.affectsConfiguration('editor.insertFinalNewline') ||
                event.affectsConfiguration('editor.trimTrailingWhitespace')
            ) {
                // Get updated configuration and notify callback
                const newConfig = this.getConfig();
                callback(newConfig);
            }
        });
    }
}
