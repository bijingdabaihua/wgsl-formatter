/**
 * WGSL Parser - Recursive descent parser for WebGPU Shading Language
 *
 * Spec Reference: SPEC.md §8-10 - All WGSL constructs
 * Parses the complete WGSL grammar including all expression precedence levels.
 */

import {
    ASTNodeType,
    Program,
    FunctionDecl,
    StructDecl,
    VariableDecl,
    Statement,
    Expression,
    Comment,
    Attribute,
    Position,
    EnableDirective,
    DiagnosticDirective,
    AliasDecl,
    OverrideDecl,
    IfStmt,
    ForStmt,
    WhileStmt,
    LoopStmt,
    SwitchStmt,
    CaseStmt,
    BreakStmt,
    ContinueStmt,
    TopLevelDecl,
    StructField,
} from './ast';
import { Token, TokenType, Tokenizer, TokenStream } from './tokenizer';

/**
 * Parse error interface
 */
export interface ParseError {
    message: string;
    line: number;
    column: number;
}

/**
 * Parse result interface
 */
export interface ParseResult {
    ast: Program | null;
    errors: ParseError[];
}

/**
 * WGSL Parser class
 */
export class WGSLParser {
    private stream!: TokenStream;
    private errors: ParseError[] = [];
    /** Tracks whether the last generic type parse consumed a trailing `=` via `>=` */
    private lastTypeConsumedEqual: boolean = false;

    /**
     * Parse WGSL source code
     */
    parse(source: string): ParseResult {
        this.errors = [];

        try {
            const tokenizer = new Tokenizer(source);
            const tokens = tokenizer.tokenize();
            this.stream = new TokenStream(tokens);

            const ast = this.parseProgram();
            return { ast, errors: this.errors };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown parsing error';
            this.errors.push({
                message,
                line: 1,
                column: 0,
            });
            return { ast: null, errors: this.errors };
        }
    }

    /**
     * Parse program (root node)
     */
    private parseProgram(): Program {
        const start = this.stream.peek().start;
        const declarations: TopLevelDecl[] = [];

        while (!this.stream.isEOF()) {
            try {
                const decl = this.parseTopLevelDecl();
                if (decl) {
                    declarations.push(decl);
                } else {
                    // Skip unknown token to avoid infinite loop
                    this.stream.next();
                }
            } catch (error) {
                // Error recovery: skip to next declaration
                this.skipToNextDecl();
            }
        }

        const end: Position = declarations.length > 0
            ? declarations[declarations.length - 1].end
            : start;

        return {
            type: ASTNodeType.Program,
            start,
            end,
            children: declarations,
            declarations,
        };
    }

    /**
     * Parse top-level declaration
     */
    private parseTopLevelDecl(): TopLevelDecl | null {
        // Skip comments but collect them
        if (this.stream.match(TokenType.Comment)) {
            return this.parseComment();
        }

        // Parse attributes (may decorate functions, variables, etc.)
        const attributes = this.parseAttributes();

        // Enable directive
        if (this.stream.match(TokenType.Enable)) {
            return this.parseEnableDirective();
        }

        // Diagnostic directive
        if (this.stream.match(TokenType.Diagnostic)) {
            return this.parseDiagnosticDirective();
        }

        // Alias declaration
        if (this.stream.match(TokenType.Alias)) {
            return this.parseAliasDecl();
        }

        // Struct declaration
        if (this.stream.match(TokenType.Struct)) {
            return this.parseStructDecl();
        }

        // Function declaration
        if (this.stream.match(TokenType.Fn)) {
            return this.parseFunctionDecl(attributes);
        }

        // Variable declarations (var, let, const)
        if (this.stream.match(TokenType.Var) ||
            this.stream.match(TokenType.Let) ||
            this.stream.match(TokenType.Const)) {
            return this.parseVarDecl(attributes);
        }

        // Override declaration
        if (this.stream.match(TokenType.Override)) {
            return this.parseOverrideDecl();
        }

        // Unknown token - report error
        const token = this.stream.peek();
        this.addError(`Unexpected top-level token: ${token.value}`, token.start);
        return null;
    }

    // ─── Directives ───────────────────────────────────────────────

    /**
     * Parse enable directive: `enable f16;`
     * Spec: §8.5
     */
    private parseEnableDirective(): EnableDirective {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'enable'
        const feature = this.stream.next().value;
        this.expect(TokenType.Semicolon, 'Expected ; after enable feature');
        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.EnableDirective,
            start,
            end,
            children: [],
            feature,
        };
    }

    /**
     * Parse diagnostic directive: `diagnostic(off, derivative_uniformity);`
     * Spec: §8.6
     */
    private parseDiagnosticDirective(): DiagnosticDirective {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'diagnostic'
        this.expect(TokenType.LeftParen, 'Expected ( after diagnostic');
        const severity = this.stream.next().value;
        this.expect(TokenType.Comma, 'Expected , after severity');
        const ruleName = this.stream.next().value;
        this.expect(TokenType.RightParen, 'Expected )');
        this.expect(TokenType.Semicolon, 'Expected ; after diagnostic');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.DiagnosticDirective,
            start,
            end,
            children: [],
            severity,
            ruleName,
        };
    }

    /**
     * Parse alias declaration: `alias Float4 = vec4<f32>;`
     * Spec: §8.7
     */
    private parseAliasDecl(): AliasDecl {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'alias'
        const nameToken = this.expect(TokenType.Identifier, 'Expected alias name');
        this.expect(TokenType.Equal, 'Expected = after alias name');
        const targetType = this.parseType();
        this.expect(TokenType.Semicolon, 'Expected ; after alias type');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.AliasDecl,
            start,
            end,
            children: [],
            name: nameToken?.value || '',
            targetType,
        };
    }

    /**
     * Parse override declaration: `override maxLights: u32 = 4;`
     * Spec: §8.3
     */
    private parseOverrideDecl(): OverrideDecl {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'override'
        const nameToken = this.expect(TokenType.Identifier, 'Expected override name');
        const name = nameToken?.value || '';

        let varType = '';
        if (this.stream.match(TokenType.Colon)) {
            this.stream.next();
            this.lastTypeConsumedEqual = false;
            varType = this.parseType();
        }

        let initializer: Expression | null = null;
        if (this.lastTypeConsumedEqual || this.stream.match(TokenType.Equal)) {
            if (!this.lastTypeConsumedEqual) this.stream.next();
            initializer = this.parseExpression();
        }

        this.expect(TokenType.Semicolon, 'Expected ;');
        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.OverrideDecl,
            start,
            end,
            children: initializer ? [initializer] : [],
            name,
            varType,
            initializer,
        };
    }

    // ─── Function Declarations ────────────────────────────────────

    /**
     * Parse function declaration with attributes
     * Spec: §8.1
     */
    private parseFunctionDecl(attributes: Attribute[]): FunctionDecl {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'fn'

        const nameToken = this.expect(TokenType.Identifier, 'Expected function name');
        const name = nameToken?.value || '';

        // Parameters
        this.expect(TokenType.LeftParen, 'Expected (');
        const parameters = this.parseParameterList();
        this.expect(TokenType.RightParen, 'Expected )');

        // Return type (may include attributes like @builtin(position))
        let returnType: string | null = null;
        if (this.stream.match(TokenType.Arrow)) {
            this.stream.next();
            // Skip any return type attributes
            let returnTypeParts: string[] = [];
            while (this.stream.match(TokenType.At)) {
                this.stream.next(); // @
                const attrName = this.stream.next().value; // e.g. builtin
                returnTypeParts.push(`@${attrName}`);
                if (this.stream.match(TokenType.LeftParen)) {
                    this.stream.next();
                    let args: string[] = [];
                    while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
                        args.push(this.stream.next().value);
                        if (this.stream.match(TokenType.Comma)) this.stream.next();
                    }
                    this.expect(TokenType.RightParen, 'Expected ) in attribute');
                    returnTypeParts.push(`(${args.join(', ')})`);
                }
                returnTypeParts.push(' ');
            }
            returnType = returnTypeParts.join('') + this.parseType();
        }

        // Body
        this.expect(TokenType.LeftBrace, 'Expected {');
        const body = this.parseStatementList();
        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.FunctionDecl,
            start,
            end,
            children: [...parameters, ...body],
            name,
            parameters,
            returnType,
            attributes,
            body,
        };
    }

    /**
     * Parse function parameter list
     */
    private parseParameterList(): VariableDecl[] {
        const params: VariableDecl[] = [];

        while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
            // Attributes on parameters (e.g., @builtin(vertex_index))
            const attrs = this.parseAttributes();

            const start = this.stream.peek().start;
            const nameToken = this.expect(TokenType.Identifier, 'Expected parameter name');
            if (!nameToken) break;

            this.expect(TokenType.Colon, 'Expected :');
            const varType = this.parseType();

            const end = this.stream.peek().start;
            params.push({
                type: ASTNodeType.VariableDecl,
                start,
                end,
                children: [],
                name: nameToken.value,
                varType,
                initializer: null,
                attributes: attrs,
            });

            if (this.stream.match(TokenType.Comma)) {
                this.stream.next();
            } else {
                break;
            }
        }

        return params;
    }

    // ─── Struct Declarations ──────────────────────────────────────

    /**
     * Parse struct declaration
     * Spec: §8.2
     */
    private parseStructDecl(): StructDecl {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'struct'

        const nameToken = this.expect(TokenType.Identifier, 'Expected struct name');
        const name = nameToken?.value || '';

        this.expect(TokenType.LeftBrace, 'Expected {');
        const fields = this.parseStructFieldList();
        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.StructDecl,
            start,
            end,
            children: fields,
            name,
            fields,
        };
    }

    /**
     * Parse struct field list with attributes
     * Spec: §8.2 - fields can have per-field attributes
     */
    private parseStructFieldList(): StructField[] {
        const fields: StructField[] = [];

        while (!this.stream.match(TokenType.RightBrace) && !this.stream.isEOF()) {
            // Skip comments but keep them interspersed
            if (this.stream.match(TokenType.Comment)) {
                this.stream.next(); // consume comment without storing
                continue;
            }

            // Parse per-field attributes (e.g., @location(0))
            const attrs = this.parseAttributes();

            const start = this.stream.peek().start;
            const nameToken = this.expect(TokenType.Identifier, 'Expected field name');
            if (!nameToken) break;

            this.expect(TokenType.Colon, 'Expected :');
            const varType = this.parseType();

            // Trailing commas are optional
            if (this.stream.match(TokenType.Comma)) {
                this.stream.next();
            }

            const end = this.stream.peek().start;
            fields.push({
                type: ASTNodeType.VariableDecl,
                start,
                end,
                children: [],
                name: nameToken.value,
                varType,
                attributes: attrs,
            });
        }

        return fields;
    }

    // ─── Variable Declarations ────────────────────────────────────

    /**
     * Parse variable declaration: var/let/const with storage class, type, initializer
     * Spec: §8.3
     */
    private parseVarDecl(attributes: Attribute[]): VariableDecl {
        const start = this.stream.peek().start;
        const keyword = this.stream.next().value; // var, let, or const

        // Storage class: <uniform>, <storage>, <function>, <private>, <workgroup>
        let storageClass: string | undefined;
        if (this.stream.match(TokenType.Less)) {
            this.stream.next(); // consume <
            storageClass = this.stream.next().value;
            this.expect(TokenType.Greater, 'Expected >');
        }

        const nameToken = this.expect(TokenType.Identifier, 'Expected variable name');
        const name = nameToken?.value || '';

        // Type annotation (optional for let/const when initializer is present)
        let varType = '';
        this.lastTypeConsumedEqual = false;
        if (this.stream.match(TokenType.Colon)) {
            this.stream.next(); // consume :
            varType = this.parseType();
        }

        // Initializer
        let initializer: Expression | null = null;
        if (this.lastTypeConsumedEqual || this.stream.match(TokenType.Equal)) {
            if (!this.lastTypeConsumedEqual) this.stream.next();
            initializer = this.parseExpression();
        }

        this.expect(TokenType.Semicolon, 'Expected ;');

        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.VariableDecl,
            start,
            end,
            children: initializer ? [initializer] : [],
            name,
            varType,
            keyword,
            storageClass,
            initializer,
            attributes,
        };
    }

    // ─── Statements ───────────────────────────────────────────────

    /**
     * Parse statement list within a block
     */
    private parseStatementList(): Statement[] {
        const statements: Statement[] = [];

        while (!this.stream.match(TokenType.RightBrace) && !this.stream.isEOF()) {
            // Skip comments
            if (this.stream.match(TokenType.Comment)) {
                this.stream.next();
                continue;
            }

            const stmt = this.parseStatement();
            if (stmt) {
                // Cast to Statement for storage in Statement[]
                statements.push(stmt as Statement);
            } else {
                // Skip to avoid infinite loop on errors
                this.stream.next();
            }
        }

        return statements;
    }

    /**
     * Parse a single statement
     */
    private parseStatement(): Statement | IfStmt | ForStmt | WhileStmt | LoopStmt | SwitchStmt | BreakStmt | ContinueStmt | null {
        // If/else statement
        if (this.stream.match(TokenType.If)) {
            return this.parseIfStmt();
        }

        // For statement
        if (this.stream.match(TokenType.For)) {
            return this.parseForStmt();
        }

        // While statement
        if (this.stream.match(TokenType.While)) {
            return this.parseWhileStmt();
        }

        // Loop statement (WGSL-specific)
        if (this.stream.match(TokenType.Loop)) {
            return this.parseLoopStmt();
        }

        // Switch statement
        if (this.stream.match(TokenType.Switch)) {
            return this.parseSwitchStmt();
        }

        // Return statement
        if (this.stream.match(TokenType.Return)) {
            return this.parseReturnStmt();
        }

        // Break statement
        if (this.stream.match(TokenType.Break)) {
            return this.parseBreakStmt();
        }

        // Continue statement
        if (this.stream.match(TokenType.Continue)) {
            return this.parseContinueStmt();
        }

        // Variable declaration as statement
        if (this.stream.match(TokenType.Var) ||
            this.stream.match(TokenType.Let) ||
            this.stream.match(TokenType.Const)) {
            const varDecl = this.parseVarDecl([]);
            return {
                type: ASTNodeType.Statement,
                start: varDecl.start,
                end: varDecl.end,
                children: [varDecl],
                kind: 'variableDecl',
                varDecl,
            };
        }

        // Expression or assignment statement
        return this.parseExpressionStatement();
    }

    /**
     * Parse if/else statement
     * Spec: §8.4
     */
    private parseIfStmt(): IfStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'if'

        this.expect(TokenType.LeftParen, 'Expected ( after if');
        const condition = this.parseExpression();
        this.expect(TokenType.RightParen, 'Expected )');

        this.expect(TokenType.LeftBrace, 'Expected { after if condition');
        const thenBody = this.parseStatementList();
        this.expect(TokenType.RightBrace, 'Expected }');

        // Parse optional else
        let elseBody: (IfStmt | Statement[]) | null = null;
        if (this.stream.match(TokenType.Else)) {
            this.stream.next();
            if (this.stream.match(TokenType.If)) {
                // else if
                elseBody = [this.parseIfStmt() as unknown as Statement];
            } else {
                this.expect(TokenType.LeftBrace, 'Expected { after else');
                elseBody = this.parseStatementList();
                this.expect(TokenType.RightBrace, 'Expected }');
            }
        }

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.IfStmt,
            start,
            end,
            children: [condition, ...thenBody],
            condition,
            thenBody,
            elseBody,
        };
    }

    /**
     * Parse for statement
     * Spec: §8.4
     */
    private parseForStmt(): ForStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'for'

        this.expect(TokenType.LeftParen, 'Expected ( after for');

        // Initializer (reuse standard var decl - it consumes the trailing ;)
        let initializer: Statement | null = null;
        if (!this.stream.match(TokenType.Semicolon)) {
            if (this.stream.match(TokenType.Var) || this.stream.match(TokenType.Let) || this.stream.match(TokenType.Const)) {
                const varDecl = this.parseVarDecl([]);
                initializer = {
                    type: ASTNodeType.Statement,
                    start: varDecl.start,
                    end: varDecl.end,
                    children: [varDecl],
                    kind: 'variableDecl' as const,
                    varDecl,
                };
            } else {
                const exprStmt = this.parseExpressionStatement();
                if (exprStmt) {
                    initializer = exprStmt instanceof Array ? exprStmt[0] : exprStmt;
                }
            }
        } else {
            this.stream.next(); // consume empty initializer ;
        }

        // Condition
        let condition: Expression | null = null;
        if (!this.stream.match(TokenType.Semicolon)) {
            condition = this.parseExpression();
        }
        this.expect(TokenType.Semicolon, 'Expected ; after for condition');

        // Increment
        let increment: Expression | null = null;
        if (!this.stream.match(TokenType.RightParen)) {
            increment = this.parseExpression();
        }
        this.expect(TokenType.RightParen, 'Expected ) after for clauses');

        // Body
        this.expect(TokenType.LeftBrace, 'Expected {');
        const body = this.parseStatementList();
        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.ForStmt,
            start,
            end,
            children: body,
            initializer,
            condition,
            increment,
            body,
        };
    }

    /**
     * Parse while statement
     * Spec: §8.4
     */
    private parseWhileStmt(): WhileStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'while'

        this.expect(TokenType.LeftParen, 'Expected ( after while');
        const condition = this.parseExpression();
        this.expect(TokenType.RightParen, 'Expected )');

        this.expect(TokenType.LeftBrace, 'Expected {');
        const body = this.parseStatementList();
        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.WhileStmt,
            start,
            end,
            children: [condition, ...body],
            condition,
            body,
        };
    }

    /**
     * Parse loop statement (WGSL-specific: `loop { ... }`)
     */
    private parseLoopStmt(): LoopStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'loop'

        this.expect(TokenType.LeftBrace, 'Expected {');
        const body = this.parseStatementList();
        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.LoopStmt,
            start,
            end,
            children: body,
            body,
        };
    }

    /**
     * Parse switch statement
     * Spec: §8.4
     */
    private parseSwitchStmt(): SwitchStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'switch'

        this.expect(TokenType.LeftParen, 'Expected ( after switch');
        const condition = this.parseExpression();
        this.expect(TokenType.RightParen, 'Expected )');

        this.expect(TokenType.LeftBrace, 'Expected {');

        const cases: CaseStmt[] = [];
        while (!this.stream.match(TokenType.RightBrace) && !this.stream.isEOF()) {
            if (this.stream.match(TokenType.Case) || this.stream.match(TokenType.Default)) {
                cases.push(this.parseCaseStmt());
            } else {
                // Skip unexpected tokens
                this.stream.next();
            }
        }

        this.expect(TokenType.RightBrace, 'Expected }');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.SwitchStmt,
            start,
            end,
            children: [condition, ...cases],
            condition,
            cases,
        };
    }

    /**
     * Parse case clause
     */
    private parseCaseStmt(): CaseStmt {
        const start = this.stream.peek().start;
        const selectors: (number | string)[] = [];

        if (this.stream.match(TokenType.Default)) {
            this.stream.next(); // consume 'default'
        } else {
            this.stream.next(); // consume 'case'
            // Parse case selectors
            while (!this.stream.match(TokenType.Colon) && !this.stream.isEOF()) {
                const selector = this.stream.next();
                if (selector.type === TokenType.NumberLiteral) {
                    selectors.push(parseFloat(selector.value));
                } else if (selector.type === TokenType.Identifier) {
                    selectors.push(selector.value);
                }
                if (this.stream.match(TokenType.Comma)) {
                    this.stream.next();
                }
            }
        }

        this.expect(TokenType.Colon, 'Expected : after case/default');

        // Parse body (may be a brace block or single statement)
        let body: Statement[];
        if (this.stream.match(TokenType.LeftBrace)) {
            this.stream.next();
            body = this.parseStatementList();
            this.expect(TokenType.RightBrace, 'Expected }');
        } else {
            body = [];
            // Single statement or block
            const stmt = this.parseStatement();
            if (stmt) {
                body = [stmt as Statement];
            }
        }

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.CaseStmt,
            start,
            end,
            children: body,
            selectors,
            body,
        };
    }

    /**
     * Parse return statement
     */
    private parseReturnStmt(): Statement {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'return'

        let expression: Expression | undefined;
        if (!this.stream.match(TokenType.Semicolon)) {
            expression = this.parseExpression();
        }
        this.expect(TokenType.Semicolon, 'Expected ;');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.Statement,
            start,
            end,
            children: expression ? [expression] : [],
            kind: 'return',
            expression,
        };
    }

    /**
     * Parse break statement
     */
    private parseBreakStmt(): BreakStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'break'
        this.expect(TokenType.Semicolon, 'Expected ;');
        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.BreakStmt,
            start,
            end,
            children: [],
        };
    }

    /**
     * Parse continue statement
     */
    private parseContinueStmt(): ContinueStmt {
        const start = this.stream.peek().start;
        this.stream.next(); // consume 'continue'
        this.expect(TokenType.Semicolon, 'Expected ;');
        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.ContinueStmt,
            start,
            end,
            children: [],
        };
    }

    /**
     * Parse expression statement (including assignments)
     */
    private parseExpressionStatement(): Statement | null {
        // Try to parse a compound assignment first (since it shares the left side)
        // by parsing ahead carefully
        const start = this.stream.peek().start;

        try {
            const expr = this.parseAssignmentExpression();

            if (this.stream.match(TokenType.Semicolon)) {
                this.stream.next();
                const end = this.stream.peek().start;
                return {
                    type: ASTNodeType.Statement,
                    start,
                    end,
                    children: [expr],
                    kind: 'expression',
                    expression: expr,
                };
            }

            // Not a semicolon following - error
            this.addError('Expected ;', this.stream.peek().start);
            return null;
        } catch {
            // Parse error recovery
            this.skipToSemicolon();
            return null;
        }
    }

    /**
     * Skip to next semicolon for error recovery
     */
    private skipToSemicolon(): void {
        while (!this.stream.isEOF() && !this.stream.match(TokenType.Semicolon)) {
            this.stream.next();
        }
        if (this.stream.match(TokenType.Semicolon)) {
            this.stream.next();
        }
    }

    // ─── Expressions ──────────────────────────────────────────────

    /**
     * Parse expression (entry point, lowest precedence)
     */
    private parseExpression(): Expression {
        return this.parseAssignmentExpression();
    }

    /**
     * Parse assignment expression (lowest precedence)
     * a = b, a += b, etc.
     * Spec: §10.3 - Assignment (lowest priority)
     */
    private parseAssignmentExpression(): Expression {
        const left = this.parseLogicalOrExpression();

        const assignOps = [
            TokenType.Equal, TokenType.PlusEqual, TokenType.MinusEqual,
            TokenType.StarEqual, TokenType.SlashEqual, TokenType.PercentEqual,
            TokenType.AndEqual, TokenType.OrEqual, TokenType.XorEqual,
            TokenType.ShiftLeftEqual, TokenType.ShiftRightEqual,
        ];

        if (assignOps.some(op => this.stream.match(op))) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseAssignmentExpression();
            const end = right.end;

            return {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse logical OR expression
     * a || b
     */
    private parseLogicalOrExpression(): Expression {
        let left = this.parseLogicalAndExpression();

        while (this.stream.match(TokenType.Or)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseLogicalAndExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse logical AND expression
     * a && b
     */
    private parseLogicalAndExpression(): Expression {
        let left = this.parseBitwiseOrExpression();

        while (this.stream.match(TokenType.And)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseBitwiseOrExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse bitwise OR expression
     * a | b
     */
    private parseBitwiseOrExpression(): Expression {
        let left = this.parseBitwiseXorExpression();

        while (this.stream.match(TokenType.BitwiseOr)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseBitwiseXorExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse bitwise XOR expression
     * a ^ b
     */
    private parseBitwiseXorExpression(): Expression {
        let left = this.parseBitwiseAndExpression();

        while (this.stream.match(TokenType.BitwiseXor)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseBitwiseAndExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse bitwise AND expression
     * a & b
     */
    private parseBitwiseAndExpression(): Expression {
        let left = this.parseEqualityExpression();

        while (this.stream.match(TokenType.BitwiseAnd)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseEqualityExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse equality expression
     * a == b, a != b
     */
    private parseEqualityExpression(): Expression {
        let left = this.parseRelationalExpression();

        while (this.stream.match(TokenType.EqualEqual) || this.stream.match(TokenType.NotEqual)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseRelationalExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse relational expression
     * a < b, a > b, a <= b, a >= b
     */
    private parseRelationalExpression(): Expression {
        let left = this.parseShiftExpression();

        const relOps = [
            TokenType.Less, TokenType.LessEqual,
            TokenType.Greater, TokenType.GreaterEqual,
        ];

        while (relOps.some(op => this.stream.match(op))) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseShiftExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse shift expression
     * a << b, a >> b
     */
    private parseShiftExpression(): Expression {
        let left = this.parseAdditiveExpression();

        while (this.stream.match(TokenType.ShiftLeft) || this.stream.match(TokenType.ShiftRight)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseAdditiveExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse additive expression
     * a + b, a - b
     */
    private parseAdditiveExpression(): Expression {
        let left = this.parseMultiplicativeExpression();

        while (this.stream.match(TokenType.Plus) || this.stream.match(TokenType.Minus)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseMultiplicativeExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse multiplicative expression
     * a * b, a / b, a % b
     */
    private parseMultiplicativeExpression(): Expression {
        let left = this.parseUnaryExpression();

        while (this.stream.match(TokenType.Star) ||
               this.stream.match(TokenType.Slash) ||
               this.stream.match(TokenType.Percent)) {
            const start = left.start;
            const operator = this.stream.next().value;
            const right = this.parseUnaryExpression();
            const end = right.end;

            left = {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator,
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse unary expression
     * !a, -a, ~a, *a, &a
     * Spec: §10.3 - Unary operators
     */
    private parseUnaryExpression(): Expression {
        const unaryOps = [
            TokenType.Not, TokenType.Minus, TokenType.BitwiseNot,
            TokenType.Star, TokenType.BitwiseAnd, TokenType.Plus,
        ];

        if (unaryOps.some(op => this.stream.match(op))) {
            const start = this.stream.peek().start;
            const operator = this.stream.next().value;
            const operand = this.parseUnaryExpression();
            const end = operand.end;

            return {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [operand],
                kind: 'unary',
                operator,
                operand,
            };
        }

        return this.parsePostfixExpression();
    }

    /**
     * Parse postfix expression
     * a(), a[i], a.b
     * Spec: §10.3 - Postfix operators (highest precedence)
     */
    private parsePostfixExpression(): Expression {
        let expr = this.parsePrimaryExpression();

        while (true) {
            // Function call: a(...)
            if (this.stream.match(TokenType.LeftParen)) {
                expr = this.parseCallSuffix(expr);
                continue;
            }

            // Index access: a[i]
            if (this.stream.match(TokenType.LeftBracket)) {
                expr = this.parseIndexSuffix(expr);
                continue;
            }

            // Member access: a.b
            if (this.stream.match(TokenType.Dot)) {
                expr = this.parseMemberSuffix(expr);
                continue;
            }

            break;
        }

        return expr;
    }

    /**
     * Parse function call suffix: (args)
     */
    private parseCallSuffix(callee: Expression): Expression {
        const start = callee.start;
        this.stream.next(); // consume (
        const args: Expression[] = [];

        while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
            args.push(this.parseExpression());
            if (this.stream.match(TokenType.Comma)) {
                this.stream.next();
            } else {
                break;
            }
        }

        this.expect(TokenType.RightParen, 'Expected )');
        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.Expression,
            start,
            end,
            children: args,
            kind: 'call',
            callee: this.expressionToString(callee),
            arguments: args,
        };
    }

    /**
     * Parse index suffix: [index]
     */
    private parseIndexSuffix(object: Expression): Expression {
        const start = object.start;
        this.stream.next(); // consume [
        const index = this.parseExpression();
        this.expect(TokenType.RightBracket, 'Expected ]');
        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.Expression,
            start,
            end,
            children: [object, index],
            kind: 'indexAccess',
            object,
            index,
        };
    }

    /**
     * Parse member access suffix: .member
     */
    private parseMemberSuffix(object: Expression): Expression {
        const start = object.start;
        this.stream.next(); // consume .
        const member = this.stream.next().value;
        const end = this.stream.peek().start;

        return {
            type: ASTNodeType.Expression,
            start,
            end,
            children: [object],
            kind: 'memberAccess',
            object,
            member,
        };
    }

    /**
     * Convert expression to string for use as callee
     */
    private expressionToString(expr: Expression): string {
        switch (expr.kind) {
            case 'identifier':
                return String(expr.value);
            case 'memberAccess':
                return this.expressionToString(expr.object!) + '.' + expr.member;
            case 'call':
                return this.expressionToString(expr) + '()'; // nested calls
            default:
                return String(expr.value ?? '');
        }
    }

    /**
     * Parse primary expression
     */
    private parsePrimaryExpression(): Expression {
        const start = this.stream.peek().start;

        // Parenthesized expression
        if (this.stream.match(TokenType.LeftParen)) {
            this.stream.next();
            const expr = this.parseExpression();
            this.expect(TokenType.RightParen, 'Expected )');
            return expr;
        }

        // Number literal (including .5 style)
        if (this.stream.match(TokenType.NumberLiteral)) {
            const token = this.stream.next();
            return {
                type: ASTNodeType.Expression,
                start,
                end: token.end,
                children: [],
                kind: 'literal',
                value: token.value,
            };
        }

        // Boolean literal
        if (this.stream.match(TokenType.BoolLiteral)) {
            const token = this.stream.next();
            return {
                type: ASTNodeType.Expression,
                start,
                end: token.end,
                children: [],
                kind: 'literal',
                value: token.value === 'true',
            };
        }

        // Bitwise not (handled by unary, not primary)
        // Identifier or type constructor call
        if (this.stream.match(TokenType.Identifier)) {
            const token = this.stream.next();

            // Check for generic params + call: myFunc<f32>(args)
            // Only treat as generic constructor if followed by (args)
            if (this.stream.match(TokenType.Less)) {
                // Save stream position and try generic parse
                // If it's followed by (, it's a type constructor call
                // If not, it's a comparison (a < b), so we need to restore
                // Simple approach: try to parse generic params and check for (
                const savedTokens = this.saveStreamState();
                const genericResult = this.parseGenericTypeParams(token.value);
                if (this.stream.match(TokenType.LeftParen)) {
                    // It IS a constructor call: myType<f32>(args)
                    this.stream.next();
                    const args: Expression[] = [];
                    while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
                        args.push(this.parseExpression());
                        if (this.stream.match(TokenType.Comma)) {
                            this.stream.next();
                        } else {
                            break;
                        }
                    }
                    this.expect(TokenType.RightParen, 'Expected )');
                    const end = this.stream.peek().start;
                    return {
                        type: ASTNodeType.Expression,
                        start,
                        end,
                        children: args,
                        kind: 'call',
                        callee: genericResult.typeStr,
                        arguments: args,
                    };
                }
                // Not a constructor - restore stream and treat as simple identifier
                // The comparison operators will handle `<` in parseRelationalExpression
                this.restoreStreamState(savedTokens);
                return {
                    type: ASTNodeType.Expression,
                    start,
                    end: token.end,
                    children: [],
                    kind: 'identifier',
                    value: token.value,
                };
            }

            // Simple identifier
            return {
                type: ASTNodeType.Expression,
                start,
                end: token.end,
                children: [],
                kind: 'identifier',
                value: token.value,
            };
        }

        // Type keyword as constructor (vec4, mat3, f32, etc.)
        if (this.isTypeKeyword(this.stream.peek().type)) {
            return this.parseTypeConstructor(start);
        }

        // Underscore (placeholder, used in assignments)
        if (this.stream.match(TokenType.Underscore)) {
            this.stream.next();
            return {
                type: ASTNodeType.Expression,
                start,
                end: this.stream.peek().start,
                children: [],
                kind: 'identifier',
                value: '_',
            };
        }

        // Error: unexpected token
        const token = this.stream.next();
        this.addError(`Unexpected token in expression: ${token.value}`, token.start);
        return {
            type: ASTNodeType.Expression,
            start,
            end: token.end,
            children: [],
            kind: 'identifier',
            value: '',
        };
    }

    /**
     * Parse type constructor (e.g., vec4<f32>(1.0, 2.0, ...))
     */
    private parseTypeConstructor(start: Position): Expression {
        const token = this.stream.next();
        let typeName = token.value;

        // Generic parameters
        if (this.stream.match(TokenType.Less)) {
            typeName = this.parseGenericTypeParams(typeName).typeStr;
        }

        // Must be a function call
        if (this.stream.match(TokenType.LeftParen)) {
            this.stream.next();
            const args: Expression[] = [];
            while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
                args.push(this.parseExpression());
                if (this.stream.match(TokenType.Comma)) {
                    this.stream.next();
                } else {
                    break;
                }
            }
            this.expect(TokenType.RightParen, 'Expected )');
            const end = this.stream.peek().start;
            return {
                type: ASTNodeType.Expression,
                start,
                end,
                children: args,
                kind: 'call',
                callee: typeName,
                arguments: args,
            };
        }

        // Just a type reference
        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.Expression,
            start,
            end,
            children: [],
            kind: 'identifier',
            value: typeName,
        };
    }

    /**
     * Check if token type is a WGSL type keyword
     */
    private isTypeKeyword(type: TokenType): boolean {
        return type === TokenType.Vec2 || type === TokenType.Vec3 || type === TokenType.Vec4 ||
            type === TokenType.Mat2x2 || type === TokenType.Mat3x3 || type === TokenType.Mat4x4 ||
            type === TokenType.F32 || type === TokenType.I32 || type === TokenType.U32 ||
            type === TokenType.Bool || type === TokenType.F16 ||
            type === TokenType.Array ||
            type === TokenType.Mat2x3 || type === TokenType.Mat2x4 ||
            type === TokenType.Mat3x2 || type === TokenType.Mat3x4 ||
            type === TokenType.Mat4x2 || type === TokenType.Mat4x3;
    }

    // ─── Types ────────────────────────────────────────────────────

    /**
     * Parse a WGSL type expression
     * Handles: simple types, generic types (vec4<f32>), pointer types (ptr<function, f32>)
     * texture types, array types, sampler types, atomic types
     */
    private parseType(): string {
        // Handle prefix type keywords
        if (this.stream.match(TokenType.Ptr) ||
            this.stream.match(TokenType.Atomic) ||
            this.stream.match(TokenType.Array) ||
            this.stream.match(TokenType.Sampler) ||
            this.stream.match(TokenType.SamplerComparison)) {
            const baseType = this.stream.next().value;

            // Generic parameters
            if (this.stream.match(TokenType.Less)) {
                return this.parseGenericTypeParams(baseType).typeStr;
            }

            return baseType;
        }

        // Reserved texture keywords - handled as identifiers by the tokenizer
        // But we need to detect them when they start with "texture_"
        if (this.stream.match(TokenType.Identifier)) {
            const token = this.stream.peek();
            if (token.value.startsWith('texture_')) {
                this.stream.next();
                if (this.stream.match(TokenType.Less)) {
                    return this.parseGenericTypeParams(token.value).typeStr;
                }
                return token.value;
            }
        }

        // Regular type (identifier, scalar type, vector type, matrix type)
        const typeToken = this.stream.next();
        let typeStr = typeToken.value;

        // Generic parameters
        if (this.stream.match(TokenType.Less)) {
            typeStr = this.parseGenericTypeParams(typeStr).typeStr;
        }

        return typeStr;
    }

    /**
     * Parse generic type parameters: <type1, type2, ...>
     * Handles nested generics like vec4<array<f32, 4>>
     */
    /**
     * Parse generic type parameters: <type1, type2, ...>
     * Handles `>=` ambiguity: in `vec4<f32>=expr`, the `>=` should be `>` + `=`.
     * Returns { typeStr, trailingEqual } where trailingEqual=true means `>=` was consumed as `>`.
     */
    private parseGenericTypeParams(baseType: string): { typeStr: string; trailingEqual: boolean } {
        let result = baseType;
        result += this.stream.next().value; // <

        let depth = 1;
        let trailingEqual = false;

        while (depth > 0 && !this.stream.isEOF()) {
            const token = this.stream.next();

            if (token.type === TokenType.Greater) {
                depth--;
                result += '>';
            } else if (token.type === TokenType.GreaterEqual) {
                // Handle `>=` as `>` (close generic) + `=` (assignment operator)
                depth--;
                result += '>';
                trailingEqual = true;
            } else if (token.type === TokenType.ShiftRight) {
                // Handle `>>` as two `>` (closing nested generics)
                depth -= 2;
                result += '>>';
                if (depth < 0) {
                    // One extra > closes outer, the other is extra - add back as trailing
                    depth = 0;
                    trailingEqual = false; // not >=, just > >
                }
            } else if (token.type === TokenType.Less) {
                depth++;
                result += '<';
            } else if (token.type === TokenType.Comma) {
                result += ', ';
            } else {
                result += token.value;
            }
        }

        this.lastTypeConsumedEqual = trailingEqual;
        return { typeStr: result, trailingEqual };
    }

    // ─── Attributes ───────────────────────────────────────────────

    /**
     * Parse attributes (e.g., @vertex, @group(0), @binding(0))
     * Spec: §9 - Attribute formatting
     */
    private parseAttributes(): Attribute[] {
        const attributes: Attribute[] = [];

        while (this.stream.match(TokenType.At)) {
            const start = this.stream.next().start;
            const nameToken = this.expect(TokenType.Identifier, 'Expected attribute name');
            if (!nameToken) continue;

            const args: string[] = [];

            // Parse attribute arguments if present
            if (this.stream.match(TokenType.LeftParen)) {
                this.stream.next();
                while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
                    const argToken = this.stream.next();
                    args.push(argToken.value);
                    if (this.stream.match(TokenType.Comma)) {
                        this.stream.next();
                    }
                }
                this.expect(TokenType.RightParen, 'Expected )');
            }

            const end = this.stream.peek().start;
            attributes.push({
                type: ASTNodeType.Attribute,
                start,
                end,
                children: [],
                name: nameToken.value,
                arguments: args,
            });
        }

        return attributes;
    }

    // ─── Comment ──────────────────────────────────────────────────

    /**
     * Parse comment
     */
    private parseComment(): Comment {
        const token = this.stream.next();
        const isBlockComment = token.value.startsWith('/*');

        return {
            type: ASTNodeType.Comment,
            start: token.start,
            end: token.end,
            children: [],
            text: token.value,
            isBlockComment,
        };
    }

    /**
     * Save current token stream position (for speculative parsing)
     */
    private saveStreamState(): number {
        return this.stream['position'];
    }

    /**
     * Restore token stream to saved position
     */
    private restoreStreamState(pos: number): void {
        this.stream['position'] = pos;
    }

    // ─── Helpers ──────────────────────────────────────────────────

    /**
     * Expect a specific token type
     */
    private expect(type: TokenType, message: string): Token | null {
        if (this.stream.match(type)) {
            return this.stream.next();
        }

        const token = this.stream.peek();
        this.addError(`${message}, got ${token.value}`, token.start);
        return null;
    }

    /**
     * Add parse error
     */
    private addError(message: string, position: Position): void {
        this.errors.push({
            message,
            line: position.line,
            column: position.column,
        });
    }

    /**
     * Skip to next declaration for error recovery
     */
    private skipToNextDecl(): void {
        while (!this.stream.isEOF()) {
            const token = this.stream.peek();
            if (token.type === TokenType.Fn ||
                token.type === TokenType.Struct ||
                token.type === TokenType.Var ||
                token.type === TokenType.Let ||
                token.type === TokenType.Const ||
                token.type === TokenType.Enable ||
                token.type === TokenType.Diagnostic ||
                token.type === TokenType.Alias ||
                token.type === TokenType.Override) {
                break;
            }
            this.stream.next();
        }
    }
}
