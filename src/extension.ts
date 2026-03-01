import * as vscode from 'vscode';
import { WGSLFormattingProvider } from './provider';
import { FormatterEngine } from './formatter';
import { ConfigurationManager } from './config';

// Output channel for logging
let outputChannel: vscode.OutputChannel;

/**
 * Get the output channel for logging
 * @returns The output channel instance
 */
export function getOutputChannel(): vscode.OutputChannel | undefined {
    return outputChannel;
}

/**
 * Extension activation function
 * Registers the WGSL formatting provider
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3
 */
export function activate(context: vscode.ExtensionContext): void {
    // Create output channel for logging
    outputChannel = vscode.window.createOutputChannel('WGSL Formatter');
    context.subscriptions.push(outputChannel);
    
    outputChannel.appendLine('WGSL Formatter extension is now active');

    // Create formatter engine and configuration manager
    const formatterEngine = new FormatterEngine();
    const configManager = new ConfigurationManager();

    // Create formatting provider
    const formattingProvider = new WGSLFormattingProvider(
        formatterEngine,
        configManager
    );

    // Register document formatting provider for WGSL files
    const documentFormattingDisposable = vscode.languages.registerDocumentFormattingEditProvider(
        { language: 'wgsl', scheme: 'file' },
        formattingProvider
    );

    // Register range formatting provider for WGSL files
    const rangeFormattingDisposable = vscode.languages.registerDocumentRangeFormattingEditProvider(
        { language: 'wgsl', scheme: 'file' },
        formattingProvider
    );

    // Add disposables to context
    context.subscriptions.push(documentFormattingDisposable);
    context.subscriptions.push(rangeFormattingDisposable);

    // Listen for configuration changes
    const configChangeDisposable = configManager.onConfigChange((config) => {
        outputChannel.appendLine('WGSL Formatter configuration changed: ' + JSON.stringify(config));
    });

    context.subscriptions.push(configChangeDisposable);
}

/**
 * Extension deactivation function
 * Cleanup is handled automatically by VSCode disposing subscriptions
 */
export function deactivate(): void {
    // Cleanup is handled by VSCode disposing context.subscriptions
    if (outputChannel) {
        outputChannel.appendLine('WGSL Formatter extension is now deactivated');
    }
}
