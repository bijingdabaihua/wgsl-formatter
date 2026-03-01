/**
 * Error handling module for WGSL Formatter
 * Defines error types and error handling utilities
 * Validates: Requirements 3.4, 7.1, 7.2, 7.3, 7.4
 */

import * as vscode from 'vscode';

/**
 * Error types for the WGSL Formatter
 */
export enum ErrorType {
    /** Syntax error in WGSL code */
    SyntaxError = 'SyntaxError',
    /** Internal error in formatter or parser */
    InternalError = 'InternalError',
    /** Operation timeout */
    TimeoutError = 'TimeoutError',
    /** Invalid configuration */
    ConfigError = 'ConfigError',
    /** System-level error (file I/O, memory, etc.) */
    SystemError = 'SystemError',
}

/**
 * Custom error class for WGSL Formatter errors
 */
export class WGSLFormatterError extends Error {
    public readonly type: ErrorType;
    public readonly timestamp: Date;
    public readonly context?: string;

    constructor(type: ErrorType, message: string, context?: string) {
        super(message);
        this.name = 'WGSLFormatterError';
        this.type = type;
        this.timestamp = new Date();
        this.context = context;
    }
}

/**
 * Log error to output channel
 * Validates: Requirements 1.4, 7.1, 7.2
 * 
 * @param error The error to log
 * @param outputChannel The VSCode output channel
 * @param context Additional context about where the error occurred
 */
export function logError(
    error: Error | unknown,
    outputChannel: vscode.OutputChannel | undefined,
    context?: string
): void {
    if (!outputChannel) {
        return;
    }

    const timestamp = new Date().toISOString();
    const contextStr = context ? ` in ${context}` : '';

    outputChannel.appendLine(`[${timestamp}] ERROR${contextStr}:`);

    if (error instanceof WGSLFormatterError) {
        outputChannel.appendLine(`Type: ${error.type}`);
        outputChannel.appendLine(`Message: ${error.message}`);
        if (error.context) {
            outputChannel.appendLine(`Context: ${error.context}`);
        }
    } else if (error instanceof Error) {
        outputChannel.appendLine(`Message: ${error.message}`);
    } else {
        outputChannel.appendLine(`Message: ${String(error)}`);
    }

    // Log stack trace if available
    if (error instanceof Error && error.stack) {
        outputChannel.appendLine('Stack trace:');
        outputChannel.appendLine(error.stack);
    }

    outputChannel.appendLine(''); // Empty line for readability
}

/**
 * Show error message to user with option to view details
 * Validates: Requirements 1.4, 7.1, 7.2
 * 
 * @param message The error message to display
 * @param outputChannel The output channel to show when user clicks "View Details"
 */
export async function showErrorNotification(
    message: string,
    outputChannel?: vscode.OutputChannel
): Promise<void> {
    const action = await vscode.window.showErrorMessage(
        message,
        'View Details'
    );

    if (action === 'View Details' && outputChannel) {
        outputChannel.show();
    }
}

/**
 * Show warning message to user with option to view details
 * Validates: Requirements 1.4, 7.1, 7.2
 * 
 * @param message The warning message to display
 * @param outputChannel The output channel to show when user clicks "View Details"
 */
export async function showWarningNotification(
    message: string,
    outputChannel?: vscode.OutputChannel
): Promise<void> {
    const action = await vscode.window.showWarningMessage(
        message,
        'View Details'
    );

    if (action === 'View Details' && outputChannel) {
        outputChannel.show();
    }
}

/**
 * Classify an error into one of the defined error types
 * 
 * @param error The error to classify
 * @returns The error type
 */
export function classifyError(error: Error | unknown): ErrorType {
    if (error instanceof WGSLFormatterError) {
        return error.type;
    }

    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        // Check for timeout errors
        if (message.includes('timeout') || message.includes('timed out')) {
            return ErrorType.TimeoutError;
        }

        // Check for syntax errors
        if (message.includes('syntax') || message.includes('parse') || message.includes('unexpected token')) {
            return ErrorType.SyntaxError;
        }

        // Check for configuration errors
        if (message.includes('config') || message.includes('invalid option')) {
            return ErrorType.ConfigError;
        }

        // Check for system errors
        if (message.includes('enoent') || message.includes('eacces') || message.includes('memory')) {
            return ErrorType.SystemError;
        }
    }

    // Default to internal error
    return ErrorType.InternalError;
}

/**
 * Get user-friendly error message based on error type
 * 
 * @param errorType The error type
 * @param originalMessage The original error message
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(errorType: ErrorType, originalMessage?: string): string {
    switch (errorType) {
        case ErrorType.SyntaxError:
            return 'WGSL Formatter: Unable to format due to syntax errors in the code.';

        case ErrorType.InternalError:
            return 'WGSL Formatter: An internal error occurred during formatting.';

        case ErrorType.TimeoutError:
            return 'WGSL Formatter: Formatting operation timed out. The file may be too large or complex.';

        case ErrorType.ConfigError:
            return 'WGSL Formatter: Invalid configuration detected. Using default settings.';

        case ErrorType.SystemError:
            return 'WGSL Formatter: A system error occurred. Please check the output panel for details.';

        default:
            return `WGSL Formatter: An error occurred${originalMessage ? ': ' + originalMessage : '.'}`;
    }
}
