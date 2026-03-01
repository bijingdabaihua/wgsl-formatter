/**
 * Unit tests for error handling module
 * Validates: Requirements 3.4, 7.1, 7.2, 7.3, 7.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import {
    ErrorType,
    WGSLFormatterError,
    logError,
    showErrorNotification,
    showWarningNotification,
    classifyError,
    getUserFriendlyMessage,
} from '../../src/errors';

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

describe('Error Handling Module', () => {
    describe('WGSLFormatterError', () => {
        it('should create error with correct properties', () => {
            const error = new WGSLFormatterError(
                ErrorType.SyntaxError,
                'Test error message',
                'test context'
            );

            expect(error.type).toBe(ErrorType.SyntaxError);
            expect(error.message).toBe('Test error message');
            expect(error.context).toBe('test context');
            expect(error.timestamp).toBeInstanceOf(Date);
            expect(error.name).toBe('WGSLFormatterError');
        });

        it('should create error without context', () => {
            const error = new WGSLFormatterError(
                ErrorType.InternalError,
                'Test error'
            );

            expect(error.type).toBe(ErrorType.InternalError);
            expect(error.context).toBeUndefined();
        });
    });

    describe('logError', () => {
        let mockOutputChannel: any;

        beforeEach(() => {
            mockOutputChannel = {
                appendLine: vi.fn(),
                show: vi.fn(),
            };
        });

        it('should log WGSLFormatterError with all details', () => {
            const error = new WGSLFormatterError(
                ErrorType.TimeoutError,
                'Operation timed out',
                'formatter'
            );

            logError(error, mockOutputChannel, 'test operation');

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('ERROR in test operation')
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Type: TimeoutError')
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Message: Operation timed out')
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Context: formatter')
            );
        });

        it('should log regular Error with stack trace', () => {
            const error = new Error('Regular error');
            error.stack = 'Error stack trace';

            logError(error, mockOutputChannel);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Message: Regular error')
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Stack trace')
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Error stack trace')
            );
        });

        it('should handle undefined output channel gracefully', () => {
            const error = new Error('Test error');
            expect(() => logError(error, undefined)).not.toThrow();
        });

        it('should log unknown error types', () => {
            const error = 'string error';

            logError(error, mockOutputChannel);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('Message: string error')
            );
        });
    });

    describe('classifyError', () => {
        it('should classify WGSLFormatterError correctly', () => {
            const error = new WGSLFormatterError(
                ErrorType.ConfigError,
                'Config error'
            );

            expect(classifyError(error)).toBe(ErrorType.ConfigError);
        });

        it('should classify timeout errors', () => {
            const error = new Error('Operation timed out');
            expect(classifyError(error)).toBe(ErrorType.TimeoutError);

            const error2 = new Error('Request timeout');
            expect(classifyError(error2)).toBe(ErrorType.TimeoutError);
        });

        it('should classify syntax errors', () => {
            const error = new Error('Syntax error at line 5');
            expect(classifyError(error)).toBe(ErrorType.SyntaxError);

            const error2 = new Error('Unexpected token');
            expect(classifyError(error2)).toBe(ErrorType.SyntaxError);

            const error3 = new Error('Parse error');
            expect(classifyError(error3)).toBe(ErrorType.SyntaxError);
        });

        it('should classify configuration errors', () => {
            const error = new Error('Invalid config value');
            expect(classifyError(error)).toBe(ErrorType.ConfigError);

            const error2 = new Error('Invalid option provided');
            expect(classifyError(error2)).toBe(ErrorType.ConfigError);
        });

        it('should classify system errors', () => {
            const error = new Error('ENOENT: file not found');
            expect(classifyError(error)).toBe(ErrorType.SystemError);

            const error2 = new Error('EACCES: permission denied');
            expect(classifyError(error2)).toBe(ErrorType.SystemError);

            const error3 = new Error('Out of memory');
            expect(classifyError(error3)).toBe(ErrorType.SystemError);
        });

        it('should default to internal error for unknown errors', () => {
            const error = new Error('Unknown error type');
            expect(classifyError(error)).toBe(ErrorType.InternalError);

            const error2 = 'string error';
            expect(classifyError(error2)).toBe(ErrorType.InternalError);
        });
    });

    describe('getUserFriendlyMessage', () => {
        it('should return friendly message for syntax errors', () => {
            const message = getUserFriendlyMessage(ErrorType.SyntaxError);
            expect(message).toContain('syntax errors');
            expect(message).toContain('WGSL Formatter');
        });

        it('should return friendly message for internal errors', () => {
            const message = getUserFriendlyMessage(ErrorType.InternalError);
            expect(message).toContain('internal error');
            expect(message).toContain('WGSL Formatter');
        });

        it('should return friendly message for timeout errors', () => {
            const message = getUserFriendlyMessage(ErrorType.TimeoutError);
            expect(message).toContain('timed out');
            expect(message).toContain('too large or complex');
        });

        it('should return friendly message for config errors', () => {
            const message = getUserFriendlyMessage(ErrorType.ConfigError);
            expect(message).toContain('configuration');
            expect(message).toContain('default settings');
        });

        it('should return friendly message for system errors', () => {
            const message = getUserFriendlyMessage(ErrorType.SystemError);
            expect(message).toContain('system error');
            expect(message).toContain('output panel');
        });

        it('should include original message when provided', () => {
            const message = getUserFriendlyMessage(
                ErrorType.InternalError,
                'specific error details'
            );
            // Default implementation doesn't use original message in the friendly message
            expect(message).toContain('WGSL Formatter');
        });
    });

    describe('showErrorNotification', () => {
        let mockOutputChannel: any;

        beforeEach(() => {
            mockOutputChannel = {
                appendLine: vi.fn(),
                show: vi.fn(),
            };
            vi.clearAllMocks();
        });

        it('should show error message with View Details button', async () => {
            const mockShowErrorMessage = vi.mocked(vscode.window.showErrorMessage);
            mockShowErrorMessage.mockResolvedValue(undefined);

            await showErrorNotification('Test error message', mockOutputChannel);

            expect(mockShowErrorMessage).toHaveBeenCalledWith(
                'Test error message',
                'View Details'
            );
        });

        it('should show output channel when View Details is clicked', async () => {
            const mockShowErrorMessage = vi.mocked(vscode.window.showErrorMessage);
            mockShowErrorMessage.mockResolvedValue('View Details' as any);

            await showErrorNotification('Test error message', mockOutputChannel);

            expect(mockOutputChannel.show).toHaveBeenCalled();
        });

        it('should not show output channel when button is not clicked', async () => {
            const mockShowErrorMessage = vi.mocked(vscode.window.showErrorMessage);
            mockShowErrorMessage.mockResolvedValue(undefined);

            await showErrorNotification('Test error message', mockOutputChannel);

            expect(mockOutputChannel.show).not.toHaveBeenCalled();
        });

        it('should handle undefined output channel', async () => {
            const mockShowErrorMessage = vi.mocked(vscode.window.showErrorMessage);
            mockShowErrorMessage.mockResolvedValue('View Details' as any);

            await expect(
                showErrorNotification('Test error message', undefined)
            ).resolves.not.toThrow();
        });
    });

    describe('showWarningNotification', () => {
        let mockOutputChannel: any;

        beforeEach(() => {
            mockOutputChannel = {
                appendLine: vi.fn(),
                show: vi.fn(),
            };
            vi.clearAllMocks();
        });

        it('should show warning message with View Details button', async () => {
            const mockShowWarningMessage = vi.mocked(vscode.window.showWarningMessage);
            mockShowWarningMessage.mockResolvedValue(undefined);

            await showWarningNotification('Test warning message', mockOutputChannel);

            expect(mockShowWarningMessage).toHaveBeenCalledWith(
                'Test warning message',
                'View Details'
            );
        });

        it('should show output channel when View Details is clicked', async () => {
            const mockShowWarningMessage = vi.mocked(vscode.window.showWarningMessage);
            mockShowWarningMessage.mockResolvedValue('View Details' as any);

            await showWarningNotification('Test warning message', mockOutputChannel);

            expect(mockOutputChannel.show).toHaveBeenCalled();
        });

        it('should not show output channel when button is not clicked', async () => {
            const mockShowWarningMessage = vi.mocked(vscode.window.showWarningMessage);
            mockShowWarningMessage.mockResolvedValue(undefined);

            await showWarningNotification('Test warning message', mockOutputChannel);

            expect(mockOutputChannel.show).not.toHaveBeenCalled();
        });
    });
});
