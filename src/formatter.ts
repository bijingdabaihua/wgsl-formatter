/**
 * Formatter Engine - Core formatting logic for WGSL code
 */

import {
    Program,
    ASTNode,
    ASTNodeType,
    FunctionDecl,
    StructDecl,
    VariableDecl,
    Statement,
    Comment,
} from './ast';
import { WGSLParser } from './parser';
import { IndentationRule } from './rules/indentation';
import { SpacingRule } from './rules/spacing';
import { AlignmentRule } from './rules/alignment';
import { BlankLineRule } from './rules/blankline';
import { LineWrappingRule } from './rules/linewrapping';
import { WGSLFormatterError, ErrorType } from './errors';

/**
 * Formatting options
 */
export interface FormatOptions {
    indentSize: number;
    useTabs: boolean;
    insertFinalNewline: boolean;
    trimTrailingWhitespace: boolean;
    maxLineLength: number;
    enableLineWrapping: boolean;
    timeout?: number; // Timeout in milliseconds (default: 2000ms)
}

/**
 * Formatting result
 */
export interface FormatResult {
    formattedText: string;
    success: boolean;
    error?: string;
}

/**
 * Formatting context for rule application
 */
export interface FormatContext {
    indentLevel: number;
    options: FormatOptions;
    output: string[];
    currentLine: string;
}

/**
 * Base interface for formatting rules
 */
export interface FormattingRule {
    apply(node: ASTNode, context: FormatContext): void;
}

/**
 * Formatter Engine class
 */
export class FormatterEngine {
    private parser: WGSLParser;
    private indentationRule: IndentationRule;
    private spacingRule: SpacingRule;
    private alignmentRule: AlignmentRule;
    private blankLineRule: BlankLineRule;
    private lineWrappingRule: LineWrappingRule;
    private startTime: number = 0;
    private timeoutMs: number = 2000; // Default 2 second timeout

    constructor() {
        this.parser = new WGSLParser();
        this.indentationRule = new IndentationRule();
        this.spacingRule = new SpacingRule();
        this.alignmentRule = new AlignmentRule();
        this.blankLineRule = new BlankLineRule();
        this.lineWrappingRule = new LineWrappingRule();
    }

    /**
     * Detect the newline style used in the source code
     * Validates: Requirement 10.5
     *
     * @param source - Source code to analyze
     * @returns '\r\n' for CRLF (Windows), '\n' for LF (Unix/Mac)
     */
    private detectNewlineStyle(source: string): '\r\n' | '\n' {
        // Check if source contains CRLF
        if (source.includes('\r\n')) {
            return '\r\n';
        }
        // Default to LF
        return '\n';
    }

    /**
     * Normalize newlines to LF for internal processing
     *
     * @param source - Source code with any newline style
     * @returns Source code with LF newlines only
     */
    private normalizeNewlines(source: string): string {
        return source.replace(/\r\n/g, '\n');
    }

    /**
     * Convert newlines to the specified style
     * Validates: Requirement 10.5
     *
     * @param text - Text with LF newlines
     * @param style - Target newline style
     * @returns Text with the specified newline style
     */
    private convertNewlines(text: string, style: '\r\n' | '\n'): string {
        if (style === '\r\n') {
            return text.replace(/\n/g, '\r\n');
        }
        return text;
    }

    /**
     * Check if the operation has timed out
     * Validates: Requirement 7.3
     *
     * @throws WGSLFormatterError if timeout exceeded
     */
    private checkTimeout(): void {
        const elapsed = Date.now() - this.startTime;
        if (elapsed > this.timeoutMs) {
            throw new WGSLFormatterError(
                ErrorType.TimeoutError,
                `Formatting operation timed out after ${this.timeoutMs}ms`,
                'FormatterEngine'
            );
        }
    }

    /**
     * Format entire WGSL source code
     * Validates: Requirements 3.4, 7.1, 7.2, 7.3, 7.4, 10.5
     *
     * Error Recovery Strategy:
     * - On syntax errors: Return original content unchanged
     * - On internal errors: Return original content unchanged
     * - On timeout: Return original content unchanged
     * - All errors are captured and reported in the result
     */
    format(source: string, options: FormatOptions): FormatResult {
        // Initialize timeout tracking
        this.startTime = Date.now();
        this.timeoutMs = options.timeout || 2000;

        try {
            // Detect original newline style
            // Validates: Requirement 10.5
            const newlineStyle = this.detectNewlineStyle(source);

            // Normalize newlines to LF for internal processing
            const normalizedSource = this.normalizeNewlines(source);

            // Check timeout before starting
            this.checkTimeout();

            // Parse the source code
            const parseResult = this.parser.parse(normalizedSource);

            // Check timeout after parsing
            this.checkTimeout();

            // If parsing failed completely, return original source
            // Validates: Requirement 3.4, 7.4
            if (!parseResult.ast) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    'Failed to parse source code',
                    'FormatterEngine.format'
                );
            }

            // If there were parse errors, return original content
            // This implements error recovery by preserving original content
            // Validates: Requirement 3.4, 7.4
            if (parseResult.errors && parseResult.errors.length > 0) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    `Parse errors found: ${parseResult.errors.map(e => e.message).join(', ')}`,
                    'FormatterEngine.format'
                );
            }

            // Create formatting context
            const context: FormatContext = {
                indentLevel: 0,
                options,
                output: [],
                currentLine: '',
            };

            // Traverse AST and apply formatting rules
            this.traverseAndFormat(parseResult.ast, context);

            // Check timeout after traversal
            this.checkTimeout();

            // Apply post-processing rules
            let formattedText = context.output.join('\n');

            // Apply line wrapping to output if enabled
            if (options.enableLineWrapping) {
                formattedText = this.applyLineWrappingToOutput(formattedText, options);
            }

            // Apply trailing whitespace rule
            if (options.trimTrailingWhitespace) {
                formattedText = this.removeTrailingWhitespace(formattedText);
            }

            // Apply final newline rule
            if (options.insertFinalNewline) {
                formattedText = this.ensureFinalNewline(formattedText);
            }

            // Convert newlines back to original style
            // Validates: Requirement 10.5
            formattedText = this.convertNewlines(formattedText, newlineStyle);

            // Final timeout check
            this.checkTimeout();

            return {
                formattedText,
                success: true,
            };
        } catch (error) {
            // Error recovery: return original content on any error
            // Validates: Requirements 3.4, 7.4
            if (error instanceof WGSLFormatterError) {
                return {
                    formattedText: source,
                    success: false,
                    error: `${error.type}: ${error.message}`,
                };
            }

            // Handle unexpected errors (internal errors)
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                formattedText: source,
                success: false,
                error: `${ErrorType.InternalError}: ${message}`,
            };
        }
    }

    /**
     * Format a specific range of lines
     * Parses the complete document but only formats the specified line range
     * Keeps code outside the selected range unchanged
     * Validates: Requirements 3.4, 7.1, 7.2, 7.3, 7.4, 10.5
     *
     * Error Recovery Strategy:
     * - On syntax errors: Return original content unchanged
     * - On internal errors: Return original content unchanged
     * - On timeout: Return original content unchanged
     * - All errors are captured and reported in the result
     */
    formatRange(
        source: string,
        startLine: number,
        endLine: number,
        options: FormatOptions
    ): FormatResult {
        // Initialize timeout tracking
        this.startTime = Date.now();
        this.timeoutMs = options.timeout || 2000;

        try {
            // Detect original newline style
            // Validates: Requirement 10.5
            const newlineStyle = this.detectNewlineStyle(source);

            // Normalize newlines to LF for internal processing
            const normalizedSource = this.normalizeNewlines(source);

            // Check timeout before starting
            this.checkTimeout();

            // Parse the entire source to build AST
            const parseResult = this.parser.parse(normalizedSource);

            // Check timeout after parsing
            this.checkTimeout();

            if (!parseResult.ast) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    'Failed to parse source code',
                    'FormatterEngine.formatRange'
                );
            }

            // If there were parse errors, return original content
            // Validates: Requirement 3.4, 7.4
            if (parseResult.errors && parseResult.errors.length > 0) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    `Parse errors found: ${parseResult.errors.map(e => e.message).join(', ')}`,
                    'FormatterEngine.formatRange'
                );
            }

            // Split source into lines (0-indexed)
            const lines = normalizedSource.split('\n');

            // Validate range
            if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
                return {
                    formattedText: source,
                    success: false,
                    error: 'Invalid line range',
                };
            }

            const program = parseResult.ast as Program;

            // Find declarations that intersect with the range
            const declarationsToFormat: Array<{
                decl: ASTNode;
                startLine: number;
                endLine: number;
            }> = [];

            for (const decl of program.declarations) {
                const declStartLine = decl.start.line - 1; // Convert to 0-indexed
                let declEndLine = decl.end.line - 1;     // Convert to 0-indexed

                // Adjust end line to point to actual content, not the start of next declaration
                // The parser's end position points to the start of the next token,
                // which may be on the next line. We need to find the actual last line of content.
                while (declEndLine > declStartLine && declEndLine < lines.length) {
                    const line = lines[declEndLine].trim();
                    // If this line is empty or starts a new declaration, the actual content ends before it
                    if (line === '' || line.startsWith('fn ') || line.startsWith('struct ') ||
                        line.startsWith('var ') || line.startsWith('//') || line.startsWith('@')) {
                        declEndLine--;
                    } else {
                        break;
                    }
                }

                // Check if the range intersects with this declaration
                const rangeIntersects =
                    (startLine >= declStartLine && startLine <= declEndLine) ||
                    (endLine >= declStartLine && endLine <= declEndLine) ||
                    (startLine <= declStartLine && endLine >= declEndLine);

                if (rangeIntersects) {
                    declarationsToFormat.push({
                        decl,
                        startLine: declStartLine,
                        endLine: declEndLine,
                    });
                }
            }

            // If no declarations to format, return original
            if (declarationsToFormat.length === 0) {
                return {
                    formattedText: source,
                    success: true,
                };
            }

            // Sort declarations by start line
            declarationsToFormat.sort((a, b) => a.startLine - b.startLine);

            // Build result by formatting only the selected declarations
            const result: string[] = [];
            let currentLine = 0;

            for (const { decl, startLine: declStart, endLine: declEnd } of declarationsToFormat) {
                // Check timeout periodically
                this.checkTimeout();

                // Add unchanged lines before this declaration
                while (currentLine < declStart) {
                    result.push(lines[currentLine]);
                    currentLine++;
                }

                // Skip if we've already processed this line (overlapping declarations)
                if (currentLine > declStart) {
                    continue;
                }

                // Format this declaration using the existing AST
                const context: FormatContext = {
                    indentLevel: 0,
                    options,
                    output: [],
                    currentLine: '',
                };

                this.formatDeclaration(decl, context);

                // Check if the original declaration was on a single line
                const wasSingleLine = declStart === declEnd;

                if (wasSingleLine && context.output.length > 1) {
                    // Original was single-line, but formatted output is multi-line
                    // Join it back to a single line to preserve line structure
                    const singleLine = context.output.join(' ').replace(/\s+/g, ' ').trim();
                    result.push(singleLine);
                } else {
                    // Add the formatted declaration as-is
                    result.push(...context.output);
                }

                currentLine = declEnd + 1;
            }

            // Add remaining unchanged lines
            while (currentLine < lines.length) {
                result.push(lines[currentLine]);
                currentLine++;
            }

            let formattedText = result.join('\n');

            // Apply trailing whitespace rule if needed
            if (options.trimTrailingWhitespace) {
                formattedText = this.removeTrailingWhitespace(formattedText);
            }

            // Convert newlines back to original style
            // Validates: Requirement 10.5
            formattedText = this.convertNewlines(formattedText, newlineStyle);

            return {
                formattedText,
                success: true,
            };
        } catch (error) {
            // Error recovery: return original content on any error
            // Validates: Requirements 3.4, 7.4
            if (error instanceof WGSLFormatterError) {
                return {
                    formattedText: source,
                    success: false,
                    error: `${error.type}: ${error.message}`,
                };
            }

            // Handle unexpected errors (internal errors)
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                formattedText: source,
                success: false,
                error: `${ErrorType.InternalError}: ${message}`,
            };
        }
    }


    /**
     * Traverse AST and apply formatting
     */
    private traverseAndFormat(node: ASTNode, context: FormatContext): void {
        if (node.type === ASTNodeType.Program) {
            this.formatProgram(node as Program, context);
        }
    }

    /**
     * Format program (root node)
     */
    private formatProgram(program: Program, context: FormatContext): void {
        const declarations = program.declarations;
        let previousNode: ASTNode | null = null;

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];

            // Add blank line between different declaration types
            if (previousNode && this.blankLineRule.shouldAddBlankLineBefore(decl, previousNode)) {
                context.output.push('');
            }

            // Format the declaration
            this.formatDeclaration(decl, context);

            previousNode = decl;
        }
    }

    /**
     * Format a declaration
     */
    private formatDeclaration(node: ASTNode, context: FormatContext): void {
        switch (node.type) {
            case ASTNodeType.FunctionDecl:
                this.formatFunctionDecl(node as FunctionDecl, context);
                break;

            case ASTNodeType.StructDecl:
                this.formatStructDecl(node as StructDecl, context);
                break;

            case ASTNodeType.VariableDecl:
                this.formatVariableDecl(node as VariableDecl, context);
                break;

            case ASTNodeType.Comment:
                this.formatComment(node as Comment, context);
                break;
        }
    }

    /**
     * Format function declaration
     */
    private formatFunctionDecl(func: FunctionDecl, context: FormatContext): void {
        const indent = this.indentationRule.getIndentString(context);
        const indentUnit = context.options.useTabs ? '\t' : ' '.repeat(context.options.indentSize);

        // Check if line wrapping is enabled
        if (context.options.enableLineWrapping) {
            // Build full signature to check length
            const params = func.parameters
                .map(p => `${p.name}: ${p.varType}`)
                .join(', ');
            const returnType = func.returnType ? ` -> ${func.returnType}` : '';
            const fullSignature = `${indent}fn ${func.name}(${params})${returnType} {`;

            // If signature exceeds max length, use line wrapping
            if (this.lineWrappingRule.shouldWrap(fullSignature, context.options.maxLineLength)) {
                const wrappedLines = this.lineWrappingRule.wrapFunctionSignature(
                    func,
                    indent,
                    indentUnit,
                    context.options.maxLineLength
                );

                // Add all lines except the opening brace
                for (let i = 0; i < wrappedLines.length - 1; i++) {
                    context.output.push(wrappedLines[i]);
                }

                // The last line is the opening brace
                context.output.push(wrappedLines[wrappedLines.length - 1]);

                // Format function body
                context.indentLevel++;
                for (const stmt of func.body) {
                    this.formatStatement(stmt, context);
                }
                context.indentLevel--;

                context.output.push(`${indent}}`);
                return;
            }
        }

        // Standard formatting (no wrapping needed or wrapping disabled)
        // Format attributes
        for (const attr of func.attributes) {
            context.output.push(`${indent}@${attr.name}`);
        }

        // Format function signature
        const params = func.parameters
            .map(p => `${p.name}: ${p.varType}`)
            .join(', ');

        const returnType = func.returnType ? ` -> ${func.returnType}` : '';
        context.output.push(`${indent}fn ${func.name}(${params})${returnType} {`);

        // Format function body
        context.indentLevel++;
        for (const stmt of func.body) {
            this.formatStatement(stmt, context);
        }
        context.indentLevel--;

        context.output.push(`${indent}}`);
    }

    /**
     * Format struct declaration
     */
    private formatStructDecl(struct: StructDecl, context: FormatContext): void {
        const indent = this.indentationRule.getIndentString(context);

        // Format struct header
        context.output.push(`${indent}struct ${struct.name} {`);

        // Format struct fields with alignment
        context.indentLevel++;
        const fieldIndent = this.indentationRule.getIndentString(context);
        const formattedFields = this.alignmentRule.formatStructFields(struct, fieldIndent);
        context.output.push(...formattedFields);
        context.indentLevel--;

        context.output.push(`${indent}}`);
    }

    /**
     * Format variable declaration
     */
    private formatVariableDecl(varDecl: VariableDecl, context: FormatContext): void {
        const indent = this.indentationRule.getIndentString(context);
        let line = `${indent}var ${varDecl.name}: ${varDecl.varType}`;

        if (varDecl.initializer) {
            const initExpr = this.spacingRule.formatExpression(varDecl.initializer);
            line += ` = ${initExpr}`;
        }

        line += ';';
        context.output.push(line);
    }

    /**
     * Format statement
     */
    private formatStatement(stmt: Statement, context: FormatContext): void {
        const indent = this.indentationRule.getIndentString(context);

        if (stmt.kind === 'return') {
            if (stmt.expression) {
                const expr = this.spacingRule.formatExpression(stmt.expression);
                context.output.push(`${indent}return ${expr};`);
            } else {
                context.output.push(`${indent}return;`);
            }
        } else if (stmt.kind === 'expression') {
            // Check if this statement contains a variable declaration
            if (stmt.children.length > 0 && stmt.children[0].type === ASTNodeType.VariableDecl) {
                this.formatVariableDecl(stmt.children[0] as VariableDecl, context);
            } else if (stmt.expression) {
                const expr = this.spacingRule.formatExpression(stmt.expression);
                context.output.push(`${indent}${expr};`);
            }
        }
    }

    /**
     * Format comment
     */
    private formatComment(comment: Comment, context: FormatContext): void {
        const indent = this.indentationRule.getIndentString(context);
        context.output.push(`${indent}${comment.text}`);
    }

    /**
     * Remove trailing whitespace from all lines
     */
    private removeTrailingWhitespace(text: string): string {
        return text
            .split('\n')
            .map(line => line.replace(/[ \t]+$/, ''))
            .join('\n');
    }

    /**
     * Apply line wrapping to formatted output
     * This is a post-processing step to catch any remaining long lines
     * Validates: Requirement 11.3
     * 
     * @param text - Formatted text
     * @param options - Format options
     * @returns Text with line wrapping applied
     */
    private applyLineWrappingToOutput(text: string, options: FormatOptions): string {
        const lines = text.split('\n');
        const result: string[] = [];
        const indentUnit = options.useTabs ? '\t' : ' '.repeat(options.indentSize);

        for (const line of lines) {
            // Check if line needs wrapping
            if (this.lineWrappingRule.shouldWrap(line, options.maxLineLength)) {
                // Get the indentation of the current line
                const match = line.match(/^(\s*)/);
                const indent = match ? match[1] : '';
                const content = line.substring(indent.length);

                // Check if it's a single indivisible token
                if (this.lineWrappingRule.isSingleIndivisibleToken(content)) {
                    // Cannot wrap, keep as-is
                    result.push(line);
                } else {
                    // Try to wrap at reasonable points (spaces, operators)
                    const wrapped = this.wrapLongLine(line, indent, indentUnit, options.maxLineLength);
                    result.push(...wrapped);
                }
            } else {
                result.push(line);
            }
        }

        return result.join('\n');
    }

    /**
     * Wrap a long line at reasonable break points
     * 
     * @param line - Line to wrap
     * @param indent - Current indentation
     * @param indentUnit - Indentation unit
     * @param maxLength - Maximum line length
     * @returns Array of wrapped lines
     */
    private wrapLongLine(line: string, indent: string, indentUnit: string, maxLength: number): string[] {
        const result: string[] = [];
        const content = line.substring(indent.length);
        const contIndent = indent + indentUnit;

        // Simple wrapping strategy: break at spaces
        let currentLine = indent;
        const words = content.split(/(\s+)/); // Keep whitespace in split

        for (const word of words) {
            if (word.trim().length === 0) {
                // Whitespace - add to current line if not at start
                if (currentLine.length > indent.length) {
                    currentLine += word;
                }
                continue;
            }

            // Check if adding this word would exceed max length
            const testLine = currentLine.length === indent.length
                ? currentLine + word
                : currentLine + word;

            if (testLine.length > maxLength && currentLine.length > indent.length) {
                // Would exceed - start new line
                result.push(currentLine.trimEnd());
                currentLine = contIndent + word;
            } else {
                // Fits - add to current line
                currentLine = testLine;
            }
        }

        // Add final line
        if (currentLine.trim().length > 0) {
            result.push(currentLine.trimEnd());
        }

        return result.length > 0 ? result : [line];
    }

    /**
     * Ensure file ends with exactly one newline
     */
    private ensureFinalNewline(text: string): string {
        // Remove all trailing newlines
        text = text.replace(/\n+$/, '');
        // Add exactly one newline
        return text + '\n';
    }
}

