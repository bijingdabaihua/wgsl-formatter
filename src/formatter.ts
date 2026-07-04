/**
 * Formatter Engine - Core formatting logic for WGSL code
 *
 * Spec Reference: SPEC.md
 * Implements all formatting rules defined in the specification.
 */

import {
    Program,
    ASTNodeType,
    FunctionDecl,
    StructDecl,
    VariableDecl,
    Statement,
    Comment,
    Attribute,
    TopLevelDecl,
    StructField,
    Expression,
    IfStmt,
    ForStmt,
    WhileStmt,
    SwitchStmt,
    CaseStmt,
    BreakStmt,
    ContinueStmt,
    LoopStmt,
    EnableDirective,
    DiagnosticDirective,
    AliasDecl,
    OverrideDecl,
} from './ast';
import { WGSLParser } from './parser';
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
    timeout?: number;
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
 * Spec: §1 - Indentation, §3 - Spacing, §4 - Alignment, §5 - Line Wrapping
 */
export interface FormatContext {
    indentLevel: number;
    options: FormatOptions;
    output: string[];
}

/**
 * Formatter Engine class
 */
export class FormatterEngine {
    private parser: WGSLParser;
    private startTime: number = 0;
    private timeoutMs: number = 2000;

    constructor() {
        this.parser = new WGSLParser();
    }

    /**
     * Get the indent string for the current context
     * Spec: §1 - Indentation
     */
    private getIndent(context: FormatContext): string {
        const { indentLevel, options } = context;
        if (options.useTabs) {
            return '\t'.repeat(indentLevel);
        }
        return ' '.repeat(indentLevel * options.indentSize);
    }

    /**
     * Get the indent unit (one level of indentation)
     */
    private getIndentUnit(context: FormatContext): string {
        const { options } = context;
        if (options.useTabs) {
            return '\t';
        }
        return ' '.repeat(options.indentSize);
    }

    /**
     * Detect the newline style used in the source code
     */
    private detectNewlineStyle(source: string): '\r\n' | '\n' {
        if (source.includes('\r\n')) {
            return '\r\n';
        }
        return '\n';
    }

    /**
     * Normalize newlines to LF for internal processing
     */
    private normalizeNewlines(source: string): string {
        return source.replace(/\r\n/g, '\n');
    }

    /**
     * Convert newlines to the specified style
     */
    private convertNewlines(text: string, style: '\r\n' | '\n'): string {
        if (style === '\r\n') {
            return text.replace(/\n/g, '\r\n');
        }
        return text;
    }

    /**
     * Check if the operation has timed out
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

    // ════════════════════════════════════════════════════════════════
    // MAIN FORMAT METHODS
    // ════════════════════════════════════════════════════════════════

    /**
     * Format entire WGSL source code
     * Spec: All sections
     */
    format(source: string, options: FormatOptions): FormatResult {
        this.startTime = Date.now();
        this.timeoutMs = options.timeout || 2000;

        try {
            const newlineStyle = this.detectNewlineStyle(source);
            const normalizedSource = this.normalizeNewlines(source);

            this.checkTimeout();

            const parseResult = this.parser.parse(normalizedSource);
            this.checkTimeout();

            if (!parseResult.ast) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    'Failed to parse source code',
                    'FormatterEngine.format'
                );
            }

            if (parseResult.errors && parseResult.errors.length > 0) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    `Parse errors found: ${parseResult.errors.map(e => e.message).join(', ')}`,
                    'FormatterEngine.format'
                );
            }

            // Format the AST
            const context: FormatContext = {
                indentLevel: 0,
                options,
                output: [],
            };

            this.formatProgram(parseResult.ast, context);
            this.checkTimeout();

            let formattedText = context.output.join('\n');

            // Post-processing
            // Spec: §11.4 - Remove trailing whitespace
            if (options.trimTrailingWhitespace) {
                formattedText = this.removeTrailingWhitespace(formattedText);
            }

            // Spec: §6.3 - Final newline
            if (options.insertFinalNewline) {
                formattedText = this.ensureFinalNewline(formattedText);
            }

            // Preserve original line ending style
            formattedText = this.convertNewlines(formattedText, newlineStyle);

            return {
                formattedText,
                success: true,
            };
        } catch (error) {
            if (error instanceof WGSLFormatterError) {
                return {
                    formattedText: source,
                    success: false,
                    error: `${error.type}: ${error.message}`,
                };
            }

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
     * Parses the complete document but only formats the specified range
     */
    formatRange(
        source: string,
        startLine: number,
        endLine: number,
        options: FormatOptions
    ): FormatResult {
        this.startTime = Date.now();
        this.timeoutMs = options.timeout || 2000;

        try {
            const newlineStyle = this.detectNewlineStyle(source);
            const normalizedSource = this.normalizeNewlines(source);

            this.checkTimeout();

            const parseResult = this.parser.parse(normalizedSource);
            this.checkTimeout();

            if (!parseResult.ast) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    'Failed to parse source code',
                    'FormatterEngine.formatRange'
                );
            }

            if (parseResult.errors && parseResult.errors.length > 0) {
                throw new WGSLFormatterError(
                    ErrorType.SyntaxError,
                    `Parse errors found: ${parseResult.errors.map(e => e.message).join(', ')}`,
                    'FormatterEngine.formatRange'
                );
            }

            const lines = normalizedSource.split('\n');

            if (startLine < 0 || endLine >= lines.length || startLine > endLine) {
                return {
                    formattedText: source,
                    success: false,
                    error: 'Invalid line range',
                };
            }

            const program = parseResult.ast;

            // Find declarations that intersect with the range
            const declsToFormat: Array<{ decl: TopLevelDecl; startLine: number; endLine: number }> = [];

            for (const decl of program.declarations) {
                if (decl.type === ASTNodeType.Comment) continue; // skip standalone comments

                const dStart = decl.start.line - 1; // Convert to 0-indexed
                let dEnd = decl.end.line - 1;       // Convert to 0-indexed (may point past content)

                // The parser's end position points to the NEXT token after the declaration.
                // We need to find the actual last content line.
                while (dEnd > dStart && dEnd >= 0 && dEnd < lines.length) {
                    const trimmed = lines[dEnd].trim();
                    if (trimmed === '' ||
                        /^(fn |struct |var |let |const |enable |diagnostic |alias |override |@)/.test(trimmed)) {
                        dEnd--;
                    } else {
                        break;
                    }
                }
                // If we backed up too far or dEnd == dStart, use the original
                dEnd = Math.max(dEnd, dStart);
                dEnd = Math.min(dEnd, lines.length - 1);

                // Check intersection
                const intersects =
                    (startLine >= dStart && startLine <= dEnd) ||
                    (endLine >= dStart && endLine <= dEnd) ||
                    (startLine <= dStart && endLine >= dEnd);

                if (intersects) {
                    declsToFormat.push({ decl, startLine: dStart, endLine: dEnd });
                }
            }

            if (declsToFormat.length === 0) {
                return { formattedText: source, success: true };
            }

            declsToFormat.sort((a, b) => a.startLine - b.startLine);

            // Format each declaration individually and stitch back together
            const result: string[] = [];
            let currentLine = 0;

            for (const { decl, startLine: declStart, endLine: declEnd } of declsToFormat) {
                this.checkTimeout();

                // Add unchanged lines before this declaration
                while (currentLine < declStart) {
                    result.push(lines[currentLine]);
                    currentLine++;
                }

                // Format this declaration
                const fmtContext: FormatContext = {
                    indentLevel: 0,
                    options,
                    output: [],
                };

                this.formatTopLevelDecl(decl, fmtContext);
                result.push(...fmtContext.output);

                // Skip past the original declaration lines in source
                currentLine = declEnd + 1;
            }

            // Add remaining unchanged lines
            while (currentLine < lines.length) {
                result.push(lines[currentLine]);
                currentLine++;
            }

            let formattedText = result.join('\n');

            if (options.trimTrailingWhitespace) {
                formattedText = this.removeTrailingWhitespace(formattedText);
            }

            formattedText = this.convertNewlines(formattedText, newlineStyle);

            return { formattedText, success: true };
        } catch (error) {
            if (error instanceof WGSLFormatterError) {
                return {
                    formattedText: source,
                    success: false,
                    error: `${error.type}: ${error.message}`,
                };
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                formattedText: source,
                success: false,
                error: `${ErrorType.InternalError}: ${message}`,
            };
        }
    }

    // ════════════════════════════════════════════════════════════════
    // PROGRAM TOP-LEVEL
    // ════════════════════════════════════════════════════════════════

    /**
     * Format program (root node)
     * Spec: §6.1 - Blank lines between top-level declarations
     */
    private formatProgram(program: Program, context: FormatContext): void {
        const declarations = program.declarations;
        let prevType: ASTNodeType | null = null;

        for (let i = 0; i < declarations.length; i++) {
            const decl = declarations[i];

            // Spec: §6.1 - Add blank line between different declaration types
            if (prevType !== null && this.shouldAddBlankLine(decl.type, prevType)) {
                context.output.push('');
            }

            this.formatTopLevelDecl(decl, context);
            prevType = decl.type;
        }
    }

    /**
     * Determine if a blank line should be added between declaration types
     * Spec: §6.1 - Blank lines between top-level declarations
     */
    private shouldAddBlankLine(current: ASTNodeType, previous: ASTNodeType): boolean {
        // Comments don't change the "previous" type
        if (current === ASTNodeType.Comment) return false;
        if (previous === ASTNodeType.Comment) return true;

        // Add blank line between different types
        return current !== previous;
    }

    /**
     * Format a top-level declaration
     */
    private formatTopLevelDecl(decl: TopLevelDecl, context: FormatContext): void {
        switch (decl.type) {
            case ASTNodeType.FunctionDecl:
                this.formatFunctionDecl(decl as FunctionDecl, context);
                break;
            case ASTNodeType.StructDecl:
                this.formatStructDecl(decl as StructDecl, context);
                break;
            case ASTNodeType.VariableDecl:
                this.formatVarDecl(decl as VariableDecl, context);
                break;
            case ASTNodeType.EnableDirective:
                this.formatEnableDirective(decl as EnableDirective, context);
                break;
            case ASTNodeType.DiagnosticDirective:
                this.formatDiagnosticDirective(decl as DiagnosticDirective, context);
                break;
            case ASTNodeType.AliasDecl:
                this.formatAliasDecl(decl as AliasDecl, context);
                break;
            case ASTNodeType.OverrideDecl:
                this.formatOverrideDecl(decl as OverrideDecl, context);
                break;
            case ASTNodeType.Comment:
                this.formatComment(decl as Comment, context);
                break;
        }
    }

    // ════════════════════════════════════════════════════════════════
    // FUNCTIONS (§8.1)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format function declaration
     * Spec: §8.1 - Function declarations
     * Spec: §9 - Attributes on functions
     */
    private formatFunctionDecl(func: FunctionDecl, context: FormatContext): void {
        const indent = this.getIndent(context);
        const indentUnit = this.getIndentUnit(context);

        // Format attributes (each on its own line)
        // Spec: §9.1 - One attribute per line
        this.formatAttributes(func.attributes, indent, context);

        // Build parameter strings
        const paramStrs = func.parameters.map(p => {
            const paramAttrStr = p.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ');
            const prefix = paramAttrStr ? paramAttrStr + ' ' : '';
            return `${prefix}${p.name}: ${p.varType}`;
        });

        const paramsJoined = paramStrs.join(', ');
        const returnType = func.returnType ? ` -> ${func.returnType}` : '';
        const signature = `fn ${func.name}(${paramsJoined})${returnType} {`;

        // Check if line wrapping needed
        // Spec: §5.2 - Function signature wrapping
        if (context.options.enableLineWrapping &&
            this.lineLength(indent + signature, context) > context.options.maxLineLength) {
            this.formatWrappedFunction(func, paramStrs, indent, indentUnit, context);
            return;
        }

        // Standard formatting (fits on one line)
        context.output.push(`${indent}${signature}`);

        // Body
        if (func.body.length > 0) {
            context.indentLevel++;
            for (const stmt of func.body) {
                this.formatStatement(stmt, context);
            }
            context.indentLevel--;
        }

        context.output.push(`${indent}}`);
    }

    /**
     * Format function with wrapped signature
     * Spec: §5.2 - Each parameter on its own line
     */
    private formatWrappedFunction(
        func: FunctionDecl,
        paramStrs: string[],
        indent: string,
        indentUnit: string,
        context: FormatContext
    ): void {
        const returnType = func.returnType ? ` -> ${func.returnType}` : '';

        // Opening: fn name(
        context.output.push(`${indent}fn ${func.name}(`);

        // Each parameter on its own line with extra indent
        // Spec: §4.2 - Align params when multi-line
        const paramIndent = indent + indentUnit;
        for (let i = 0; i < paramStrs.length; i++) {
            const suffix = i < paramStrs.length - 1 ? ',' : '';
            context.output.push(`${paramIndent}${paramStrs[i]}${suffix}`);
        }

        // Closing: ) -> returnType {
        context.output.push(`${indent})${returnType} {`);

        // Body
        context.indentLevel++;
        for (const stmt of func.body) {
            this.formatStatement(stmt, context);
        }
        context.indentLevel--;

        context.output.push(`${indent}}`);
    }

    // ════════════════════════════════════════════════════════════════
    // STRUCTS (§8.2)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format struct declaration
     * Spec: §8.2 - Struct declarations
     * Spec: §4.1 - Struct field alignment
     * Spec: §5.5 - Struct always multi-line
     */
    private formatStructDecl(struct: StructDecl, context: FormatContext): void {
        const indent = this.getIndent(context);

        // Spec: §5.5 - Struct header
        context.output.push(`${indent}struct ${struct.name} {`);

        context.indentLevel++;
        const fieldIndent = this.getIndent(context);

        // Spec: §4.1 - Align struct fields
        const formattedFields = this.formatStructFields(struct.fields, fieldIndent, context);
        for (const field of formattedFields) {
            context.output.push(field);
        }

        context.indentLevel--;
        context.output.push(`${indent}}`);
    }

    /**
     * Format struct fields with alignment
     * Spec: §4.1 - Align field types at longest field name
     * Spec: §9.3 - Per-field attributes
     */
    private formatStructFields(
        fields: StructField[],
        fieldIndent: string,
        _context: FormatContext
    ): string[] {
        if (fields.length === 0) return [];

        // Calculate alignment column (based on field names with attributes)
        // Spec: §4.1 - Find longest field name
        let maxNameLength = 0;
        for (const field of fields) {
            const attrStr = field.attributes.length > 0
                ? field.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ') + ' '
                : '';
            const nameWithColon = `${attrStr}${field.name}:`;
            if (nameWithColon.length > maxNameLength) {
                maxNameLength = nameWithColon.length;
            }
        }

        const alignColumn = maxNameLength + 1; // +1 for minimum space after colon

        const lines: string[] = [];
        for (const field of fields) {
            const attrStr = field.attributes.length > 0
                ? field.attributes.map(a => `@${a.name}${a.arguments.length > 0 ? `(${a.arguments.join(', ')})` : ''}`).join(' ') + ' '
                : '';
            const nameWithColon = `${attrStr}${field.name}:`;
            const padding = ' '.repeat(Math.max(1, alignColumn - nameWithColon.length));
            const line = `${fieldIndent}${nameWithColon}${padding}${field.varType},`;
            lines.push(line);
        }

        return lines;
    }

    // ════════════════════════════════════════════════════════════════
    // VARIABLES (§8.3)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format variable declaration
     * Spec: §8.3 - var/let/const declarations
     * Spec: §3 - All spacing rules
     */
    private formatVarDecl(varDecl: VariableDecl, context: FormatContext): void {
        const indent = this.getIndent(context);

        // Determine keyword
        const keyword = this.detectVarKeyword(varDecl);

        // Attributes (if any)
        this.formatAttributes(varDecl.attributes, indent, context);

        // Build: var name: type (or let name when type is inferred)
        let typePart = varDecl.varType ? `: ${varDecl.varType}` : '';
        let line = `${indent}${keyword} ${varDecl.name}${typePart}`;

        // Storage class: var<uniform>
        if (varDecl.storageClass) {
            line = `${indent}${keyword}<${varDecl.storageClass}> ${varDecl.name}${typePart}`;
        }

        // Initializer
        if (varDecl.initializer) {
            const initExpr = this.formatExpression(varDecl.initializer);
            // Spec: §3.1 - Spaces around =
            line += ` = ${initExpr}`;
        }

        line += ';';

        // Check if line wrapping needed
        if (context.options.enableLineWrapping &&
            this.lineLength(line, context) > context.options.maxLineLength) {
            // For now, just keep as-is if it's a simple var with long initializer
            // TODO: implement proper wrapping for variable declarations
        }

        context.output.push(line);
    }

    /**
     * Detect the keyword used for a variable declaration
     */
    private detectVarKeyword(decl: VariableDecl): string {
        return decl.keyword || 'var';
    }

    /**
     * Format enable directive
     * Spec: §8.5
     */
    private formatEnableDirective(dir: EnableDirective, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}enable ${dir.feature};`);
    }

    /**
     * Format diagnostic directive
     * Spec: §8.6
     */
    private formatDiagnosticDirective(dir: DiagnosticDirective, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}diagnostic(${dir.severity}, ${dir.ruleName});`);
    }

    /**
     * Format alias declaration
     * Spec: §8.7
     */
    private formatAliasDecl(alias: AliasDecl, context: FormatContext): void {
        const indent = this.getIndent(context);
        // Spec: §3.1 - Spaces around =
        context.output.push(`${indent}alias ${alias.name} = ${alias.targetType};`);
    }

    /**
     * Format override declaration
     * Spec: §8.3
     */
    private formatOverrideDecl(over: OverrideDecl, context: FormatContext): void {
        const indent = this.getIndent(context);
        let line = `${indent}override ${over.name}`;

        if (over.varType) {
            // Spec: §3.5 - Space after colon
            line += `: ${over.varType}`;
        }

        if (over.initializer) {
            const initExpr = this.formatExpression(over.initializer);
            line += ` = ${initExpr}`;
        }

        line += ';';
        context.output.push(line);
    }

    // ════════════════════════════════════════════════════════════════
    // STATEMENTS
    // ════════════════════════════════════════════════════════════════

    /**
     * Format a statement
     */
    private formatStatement(
        stmt: Statement | IfStmt | ForStmt | WhileStmt | LoopStmt | SwitchStmt | BreakStmt | ContinueStmt,
        context: FormatContext
    ): void {
        switch (stmt.type) {
            case ASTNodeType.IfStmt:
                this.formatIfStmt(stmt as IfStmt, context);
                break;
            case ASTNodeType.ForStmt:
                this.formatForStmt(stmt as ForStmt, context);
                break;
            case ASTNodeType.WhileStmt:
                this.formatWhileStmt(stmt as WhileStmt, context);
                break;
            case ASTNodeType.LoopStmt:
                this.formatLoopStmt(stmt as LoopStmt, context);
                break;
            case ASTNodeType.SwitchStmt:
                this.formatSwitchStmt(stmt as SwitchStmt, context);
                break;
            case ASTNodeType.BreakStmt:
                this.formatBreakStmt(stmt as BreakStmt, context);
                break;
            case ASTNodeType.ContinueStmt:
                this.formatContinueStmt(stmt as ContinueStmt, context);
                break;
            case ASTNodeType.Statement:
                this.formatSimpleStmt(stmt as Statement, context);
                break;
        }
    }

    /**
     * Format simple statement (return, expression, variableDecl)
     */
    private formatSimpleStmt(stmt: Statement, context: FormatContext): void {
        switch (stmt.kind) {
            case 'return':
                this.formatReturnStmt(stmt, context);
                break;
            case 'variableDecl':
                if (stmt.varDecl) {
                    this.formatVarDecl(stmt.varDecl, context);
                }
                break;
            case 'expression':
                this.formatExpressionStmt(stmt, context);
                break;
            case 'assignment':
                this.formatExpressionStmt(stmt, context);
                break;
        }
    }

    /**
     * Format return statement
     * Spec: §8.9
     */
    private formatReturnStmt(stmt: Statement, context: FormatContext): void {
        const indent = this.getIndent(context);
        if (stmt.expression) {
            const expr = this.formatExpression(stmt.expression);
            // Spec: §3.7 - Space after return keyword
            context.output.push(`${indent}return ${expr};`);
        } else {
            context.output.push(`${indent}return;`);
        }
    }

    /**
     * Format expression statement
     */
    private formatExpressionStmt(stmt: Statement, context: FormatContext): void {
        const indent = this.getIndent(context);
        if (stmt.expression) {
            const expr = this.formatExpression(stmt.expression);
            context.output.push(`${indent}${expr};`);
        }
    }

    /**
     * Format if/else statement
     * Spec: §8.4 - Control flow
     */
    private formatIfStmt(ifStmt: IfStmt, context: FormatContext, isElseIf: boolean = false): void {
        const indent = this.getIndent(context);
        const condition = this.formatExpression(ifStmt.condition);

        if (isElseIf) {
            // For else if, the `else ` prefix is already on the current line
            context.output.push(`${indent}if (${condition}) {`);
        } else {
            // Spec: §2.1 - OTBS brace style
            context.output.push(`${indent}if (${condition}) {`);
        }

        // Body
        this.formatBlockBody(ifStmt.thenBody, context);

        // Else
        if (ifStmt.elseBody) {
            const elseBody = ifStmt.elseBody;
            if (Array.isArray(elseBody) && elseBody.length === 1 && 'condition' in elseBody[0]) {
                // else if - inline on same line: `} else if (cond) {`
                const innerIf = elseBody[0] as unknown as IfStmt;
                const innerCond = this.formatExpression(innerIf.condition);
                context.output.push(`${indent}} else if (${innerCond}) {`);
                this.formatBlockBody(innerIf.thenBody, context);
                // Handle further else/else-if recursively
                if (innerIf.elseBody) {
                    this.formatElseContinuation(innerIf.elseBody, indent, context);
                } else {
                    context.output.push(`${indent}}`);
                }
            } else {
                context.output.push(`${indent}} else {`);
                if (Array.isArray(elseBody)) {
                    this.formatBlockBody(elseBody, context);
                }
                context.output.push(`${indent}}`);
            }
        } else {
            context.output.push(`${indent}}`);
        }
    }

    /**
     * Handle else continuation chain (for deeply nested else-if)
     */
    private formatElseContinuation(
        elseBody: IfStmt | Statement[],
        indent: string,
        context: FormatContext
    ): void {
        if (Array.isArray(elseBody)) {
            if (elseBody.length === 1 && 'condition' in elseBody[0]) {
                const innerIf = elseBody[0] as unknown as IfStmt;
                const innerCond = this.formatExpression(innerIf.condition);
                context.output.push(`${indent}} else if (${innerCond}) {`);
                this.formatBlockBody(innerIf.thenBody, context);
                if (innerIf.elseBody) {
                    this.formatElseContinuation(innerIf.elseBody, indent, context);
                } else {
                    context.output.push(`${indent}}`);
                }
            } else {
                context.output.push(`${indent}} else {`);
                this.formatBlockBody(elseBody, context);
                context.output.push(`${indent}}`);
            }
        } else {
            context.output.push(`${indent}} else {`);
            this.formatBlockBody((elseBody as unknown as IfStmt).thenBody, context);
            context.output.push(`${indent}}`);
        }
    }

    /**
     * Format for statement
     * Spec: §8.4
     */
    private formatForStmt(forStmt: ForStmt, context: FormatContext): void {
        const indent = this.getIndent(context);

        let initStr = '';
        if (forStmt.initializer) {
            if (forStmt.initializer.type === ASTNodeType.Statement) {
                const s = forStmt.initializer as Statement;
                if (s.kind === 'variableDecl' && s.varDecl) {
                    initStr = `var ${s.varDecl.name}: ${s.varDecl.varType}`;
                    if (s.varDecl.initializer) {
                        initStr += ` = ${this.formatExpression(s.varDecl.initializer)}`;
                    }
                } else if (s.expression) {
                    initStr = this.formatExpression(s.expression);
                }
            }
        }

        const condStr = forStmt.condition ? this.formatExpression(forStmt.condition) : '';
        const incStr = forStmt.increment ? this.formatExpression(forStmt.increment) : '';

        context.output.push(`${indent}for (${initStr}; ${condStr}; ${incStr}) {`);
        this.formatBlockBody(forStmt.body, context);
        context.output.push(`${indent}}`);
    }

    /**
     * Format while statement
     * Spec: §8.4
     */
    private formatWhileStmt(whileStmt: WhileStmt, context: FormatContext): void {
        const indent = this.getIndent(context);
        const condition = this.formatExpression(whileStmt.condition);

        context.output.push(`${indent}while (${condition}) {`);
        this.formatBlockBody(whileStmt.body, context);
        context.output.push(`${indent}}`);
    }

    /**
     * Format loop statement
     */
    private formatLoopStmt(loopStmt: LoopStmt, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}loop {`);
        this.formatBlockBody(loopStmt.body, context);
        context.output.push(`${indent}}`);
    }

    /**
     * Format switch statement
     * Spec: §8.4
     */
    private formatSwitchStmt(switchStmt: SwitchStmt, context: FormatContext): void {
        const indent = this.getIndent(context);
        const condition = this.formatExpression(switchStmt.condition);

        context.output.push(`${indent}switch (${condition}) {`);
        context.indentLevel++;

        for (const caseStmt of switchStmt.cases) {
            this.formatCase(caseStmt, context);
        }

        context.indentLevel--;
        context.output.push(`${indent}}`);
    }

    /**
     * Format case clause
     * Spec: §8.4
     */
    private formatCase(caseStmt: CaseStmt, context: FormatContext): void {
        const indent = this.getIndent(context);

        if (caseStmt.selectors.length === 0) {
            context.output.push(`${indent}default: {`);
        } else {
            const selectors = caseStmt.selectors.map(s => String(s)).join(', ');
            context.output.push(`${indent}case ${selectors}: {`);
        }

        context.indentLevel++;
        for (const stmt of caseStmt.body) {
            this.formatStatement(stmt, context);
        }
        context.indentLevel--;

        context.output.push(`${indent}}`);
    }

    /**
     * Format break statement
     */
    private formatBreakStmt(_stmt: BreakStmt, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}break;`);
    }

    /**
     * Format continue statement
     */
    private formatContinueStmt(_stmt: ContinueStmt, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}continue;`);
    }

    /**
     * Format block body (list of statements inside braces)
     */
    private formatBlockBody(body: Statement[], context: FormatContext): void {
        context.indentLevel++;
        for (const stmt of body) {
            this.formatStatement(stmt, context);
        }
        context.indentLevel--;
    }

    // ════════════════════════════════════════════════════════════════
    // EXPRESSIONS (§10.3)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format an expression to string with proper spacing
     * Spec: §3 - All spacing rules
     * Spec: §10.3 - Operator precedence
     */
    private formatExpression(expr: Expression): string {
        switch (expr.kind) {
            case 'literal': {
                const value = String(expr.value ?? '');
                // Preserve hex and scientific notation
                if (value.startsWith('0x') || value.includes('e') || value.includes('E')) {
                    return value;
                }
                // Add .0 for whole number floats (WGSL convention)
                if (typeof expr.value === 'number' && !Number.isInteger(expr.value)) {
                    return value;
                }
                if (typeof expr.value === 'number' && Number.isInteger(expr.value) && !value.includes('.')) {
                    // Check if it has a suffix
                    if (/^[0-9]+[fui]$/.test(value)) return value;
                    // Keep integers as-is (not all numbers in WGSL need .0)
                    return value;
                }
                return value;
            }

            case 'identifier':
                return String(expr.value ?? '');

            case 'binary':
                // Spec: §3.1 - Spaces around binary operators
                return this.formatBinaryExpr(expr);

            case 'unary':
                // Spec: §3.2 - No space after unary operator
                return `${expr.operator}${this.formatExpression(expr.operand!)}`;

            case 'call':
                // Spec: §3.8 - No space before (, space after comma
                return this.formatCallExpr(expr);

            case 'memberAccess':
                // a.b
                return `${this.formatExpression(expr.object!)}.${expr.member}`;

            case 'indexAccess':
                // a[i]
                return `${this.formatExpression(expr.object!)}[${this.formatExpression(expr.index!)}]`;

            default:
                return '';
        }
    }

    /**
     * Format binary expression
     * Spec: §3.1 - Spaces around all binary operators
     */
    private formatBinaryExpr(expr: Expression): string {
        if (!expr.left || !expr.right || !expr.operator) return '';

        const left = this.formatExpression(expr.left);
        const right = this.formatExpression(expr.right);

        // Spec: §3.1 - Space on both sides of binary operator
        return `${left} ${expr.operator} ${right}`;
    }

    /**
     * Format function call expression
     * Spec: §3.8 - No space between callee and (, space after comma
     */
    private formatCallExpr(expr: Expression): string {
        const callee = expr.callee || '';
        const args = (expr.arguments || [])
            .map(arg => this.formatExpression(arg))
            .join(', ');  // Spec: §3.3 - Space after comma

        return `${callee}(${args})`;  // Spec: §3.8 - No space before (
    }

    // ════════════════════════════════════════════════════════════════
    // ATTRIBUTES (§9)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format attributes
     * Spec: §9 - Each attribute on its own line
     * Spec: §3.10 - @ with no space before name
     */
    private formatAttributes(attrs: Attribute[], indent: string, context: FormatContext): void {
        for (const attr of attrs) {
            let attrStr = `@${attr.name}`;
            if (attr.arguments.length > 0) {
                // Spec: §9 - Attribute arguments
                attrStr += `(${attr.arguments.join(', ')})`;
            }
            context.output.push(`${indent}${attrStr}`);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // COMMENTS (§7)
    // ════════════════════════════════════════════════════════════════

    /**
     * Format comment
     * Spec: §7 - Preserve comment content, maintain indentation
     */
    private formatComment(comment: Comment, context: FormatContext): void {
        const indent = this.getIndent(context);
        context.output.push(`${indent}${comment.text}`);
    }

    // ════════════════════════════════════════════════════════════════
    // POST-PROCESSING
    // ════════════════════════════════════════════════════════════════

    /**
     * Remove trailing whitespace from all lines
     * Spec: §11.4 - No trailing whitespace
     */
    private removeTrailingWhitespace(text: string): string {
        return text.split('\n')
            .map(line => line.replace(/[ \t]+$/, ''))
            .join('\n');
    }

    /**
     * Ensure file ends with exactly one newline
     * Spec: §6.3 - File ends with exactly one newline
     */
    private ensureFinalNewline(text: string): string {
        text = text.replace(/\n+$/, '');
        return text + '\n';
    }

    /**
     * Calculate the display width of a line
     * (accounts for tab expansion)
     */
    private lineLength(line: string, context: FormatContext): number {
        if (context.options.useTabs) {
            // Approximate: each tab counts as indentSize
            const tabCount = (line.match(/\t/g) || []).length;
            const nonTabLen = line.replace(/\t/g, '').length;
            return nonTabLen + tabCount * context.options.indentSize;
        }
        return line.length;
    }
}
