/**
 * Unit tests for ConfigurationManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigurationManager, FormattingConfig } from '../../src/config';
import * as vscode from 'vscode';

// Mock vscode module
vi.mock('vscode', () => {
    const mockConfig = new Map<string, any>();

    return {
        workspace: {
            getConfiguration: vi.fn((section?: string) => ({
                get: vi.fn((key: string, defaultValue?: any) => {
                    const fullKey = section ? `${section}.${key}` : key;
                    return mockConfig.get(fullKey) ?? defaultValue;
                }),
            })),
            onDidChangeConfiguration: vi.fn((callback) => {
                return {
                    dispose: vi.fn(),
                };
            }),
        },
    };
});

describe('ConfigurationManager', () => {
    let configManager: ConfigurationManager;

    beforeEach(() => {
        configManager = new ConfigurationManager();
        vi.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should return default configuration when no user settings exist', () => {
            const config = configManager.getConfig();

            expect(config).toEqual({
                indentSize: 4,
                useTabs: false,
                insertFinalNewline: true,
                trimTrailingWhitespace: true,
                maxLineLength: 100,
                enableLineWrapping: true,
            });
        });

        it('should read wgslFormatter.indentSize from configuration', () => {
            const mockGet = vi.fn((key: string, defaultValue?: any) => {
                if (key === 'indentSize') return 2;
                return defaultValue;
            });

            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: mockGet,
            } as any);

            const config = configManager.getConfig();
            expect(config.indentSize).toBe(2);
        });

        it('should read wgslFormatter.useTabs from configuration', () => {
            const mockGet = vi.fn((key: string, defaultValue?: any) => {
                if (key === 'useTabs') return true;
                return defaultValue;
            });

            vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
                get: mockGet,
            } as any);

            const config = configManager.getConfig();
            expect(config.useTabs).toBe(true);
        });

        it('should inherit editor.insertFinalNewline from editor configuration', () => {
            let callCount = 0;
            vi.mocked(vscode.workspace.getConfiguration).mockImplementation((section?: string) => {
                callCount++;
                if (section === 'editor') {
                    return {
                        get: vi.fn((key: string, defaultValue?: any) => {
                            if (key === 'insertFinalNewline') return false;
                            return defaultValue;
                        }),
                    } as any;
                }
                return {
                    get: vi.fn((key: string, defaultValue?: any) => defaultValue),
                } as any;
            });

            const config = configManager.getConfig();
            expect(config.insertFinalNewline).toBe(false);
        });

        it('should inherit editor.trimTrailingWhitespace from editor configuration', () => {
            vi.mocked(vscode.workspace.getConfiguration).mockImplementation((section?: string) => {
                if (section === 'editor') {
                    return {
                        get: vi.fn((key: string, defaultValue?: any) => {
                            if (key === 'trimTrailingWhitespace') return false;
                            return defaultValue;
                        }),
                    } as any;
                }
                return {
                    get: vi.fn((key: string, defaultValue?: any) => defaultValue),
                } as any;
            });

            const config = configManager.getConfig();
            expect(config.trimTrailingWhitespace).toBe(false);
        });

        it('should use default indentSize of 4 when not configured', () => {
            const config = configManager.getConfig();
            expect(config.indentSize).toBe(4);
        });

        it('should use default useTabs of false when not configured', () => {
            const config = configManager.getConfig();
            expect(config.useTabs).toBe(false);
        });
    });

    describe('onConfigChange', () => {
        it('should register configuration change listener', () => {
            const callback = vi.fn();
            const disposable = configManager.onConfigChange(callback);

            expect(vscode.workspace.onDidChangeConfiguration).toHaveBeenCalled();
            expect(disposable).toBeDefined();
            expect(disposable.dispose).toBeDefined();
        });

        it('should call callback when wgslFormatter configuration changes', () => {
            const callback = vi.fn();
            let changeHandler: any;

            vi.mocked(vscode.workspace.onDidChangeConfiguration).mockImplementation((handler) => {
                changeHandler = handler;
                return { dispose: vi.fn() };
            });

            configManager.onConfigChange(callback);

            // Simulate configuration change
            const mockEvent = {
                affectsConfiguration: vi.fn((section: string) => section === 'wgslFormatter'),
            };

            changeHandler(mockEvent);

            expect(callback).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(expect.objectContaining({
                indentSize: expect.any(Number),
                useTabs: expect.any(Boolean),
                insertFinalNewline: expect.any(Boolean),
                trimTrailingWhitespace: expect.any(Boolean),
                maxLineLength: expect.any(Number),
                enableLineWrapping: expect.any(Boolean),
            }));
        });

        it('should call callback when editor.insertFinalNewline changes', () => {
            const callback = vi.fn();
            let changeHandler: any;

            vi.mocked(vscode.workspace.onDidChangeConfiguration).mockImplementation((handler) => {
                changeHandler = handler;
                return { dispose: vi.fn() };
            });

            configManager.onConfigChange(callback);

            // Simulate configuration change
            const mockEvent = {
                affectsConfiguration: vi.fn((section: string) =>
                    section === 'editor.insertFinalNewline'
                ),
            };

            changeHandler(mockEvent);

            expect(callback).toHaveBeenCalled();
        });

        it('should call callback when editor.trimTrailingWhitespace changes', () => {
            const callback = vi.fn();
            let changeHandler: any;

            vi.mocked(vscode.workspace.onDidChangeConfiguration).mockImplementation((handler) => {
                changeHandler = handler;
                return { dispose: vi.fn() };
            });

            configManager.onConfigChange(callback);

            // Simulate configuration change
            const mockEvent = {
                affectsConfiguration: vi.fn((section: string) =>
                    section === 'editor.trimTrailingWhitespace'
                ),
            };

            changeHandler(mockEvent);

            expect(callback).toHaveBeenCalled();
        });

        it('should not call callback when unrelated configuration changes', () => {
            const callback = vi.fn();
            let changeHandler: any;

            vi.mocked(vscode.workspace.onDidChangeConfiguration).mockImplementation((handler) => {
                changeHandler = handler;
                return { dispose: vi.fn() };
            });

            configManager.onConfigChange(callback);

            // Simulate unrelated configuration change
            const mockEvent = {
                affectsConfiguration: vi.fn(() => false),
            };

            changeHandler(mockEvent);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should return disposable that can be disposed', () => {
            const callback = vi.fn();
            const mockDispose = vi.fn();

            vi.mocked(vscode.workspace.onDidChangeConfiguration).mockReturnValue({
                dispose: mockDispose,
            });

            const disposable = configManager.onConfigChange(callback);
            disposable.dispose();

            expect(mockDispose).toHaveBeenCalled();
        });
    });
});
