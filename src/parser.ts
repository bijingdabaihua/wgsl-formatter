/**
 * WGSL Parser - Recursive descent parser for WebGPU Shading Language
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
        const declarations: (FunctionDecl | StructDecl | VariableDecl | Comment)[] = [];

        while (!this.stream.isEOF()) {
            try {
                const decl = this.parseDeclaration();
                if (decl) {
                    declarations.push(decl);
                }
            } catch (error) {
                // Error recovery: skip to next declaration
                this.skipToNextDeclaration();
            }
        }

        const end = declarations.length > 0
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
    private parseDeclaration(): FunctionDecl | StructDecl | VariableDecl | Comment | null {
        // Skip comments
        if (this.stream.match(TokenType.Comment)) {
            return this.parseComment();
        }

        // Check for attributes
        const attributes = this.parseAttributes();

        // Function declaration
        if (this.stream.match(TokenType.Fn)) {
            return this.parseFunctionDecl(attributes);
        }

        // Struct declaration
        if (this.stream.match(TokenType.Struct)) {
            return this.parseStructDecl();
        }

        // Variable declaration
        if (this.stream.match(TokenType.Var) ||
            this.stream.match(TokenType.Let) ||
            this.stream.match(TokenType.Const)) {
            return this.parseVariableDecl();
        }

        // Unknown token - skip and report error
        const token = this.stream.peek();
        this.addError(`Unexpected token: ${token.value}`, token.start);
        this.stream.next();
        return null;
    }

    /**
     * Parse attributes (e.g., @vertex, @fragment)
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

    /**
     * Parse function declaration
     */
    private parseFunctionDecl(attributes: Attribute[]): FunctionDecl {
        const start = this.stream.peek().start;
        this.expect(TokenType.Fn, 'Expected fn');

        const nameToken = this.expect(TokenType.Identifier, 'Expected function name');
        const name = nameToken?.value || '';

        // Parse parameters
        this.expect(TokenType.LeftParen, 'Expected (');
        const parameters = this.parseParameterList();
        this.expect(TokenType.RightParen, 'Expected )');

        // Parse return type
        let returnType: string | null = null;
        if (this.stream.match(TokenType.Arrow)) {
            this.stream.next();
            returnType = this.parseType();
        }

        // Parse body
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
     * Parse parameter list
     */
    private parseParameterList(): VariableDecl[] {
        const parameters: VariableDecl[] = [];

        while (!this.stream.match(TokenType.RightParen) && !this.stream.isEOF()) {
            const start = this.stream.peek().start;
            const nameToken = this.expect(TokenType.Identifier, 'Expected parameter name');
            if (!nameToken) break;

            this.expect(TokenType.Colon, 'Expected :');
            const varType = this.parseType();

            const end = this.stream.peek().start;
            parameters.push({
                type: ASTNodeType.VariableDecl,
                start,
                end,
                children: [],
                name: nameToken.value,
                varType,
                initializer: null,
            });

            if (this.stream.match(TokenType.Comma)) {
                this.stream.next();
            } else {
                break;
            }
        }

        return parameters;
    }

    /**
     * Parse struct declaration
     */
    private parseStructDecl(): StructDecl {
        const start = this.stream.peek().start;
        this.expect(TokenType.Struct, 'Expected struct');

        const nameToken = this.expect(TokenType.Identifier, 'Expected struct name');
        const name = nameToken?.value || '';

        this.expect(TokenType.LeftBrace, 'Expected {');
        const fields = this.parseFieldList();
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
     * Parse struct field list
     */
    private parseFieldList(): VariableDecl[] {
        const fields: VariableDecl[] = [];

        while (!this.stream.match(TokenType.RightBrace) && !this.stream.isEOF()) {
            // Skip comments
            if (this.stream.match(TokenType.Comment)) {
                this.stream.next();
                continue;
            }

            const start = this.stream.peek().start;
            const nameToken = this.expect(TokenType.Identifier, 'Expected field name');
            if (!nameToken) break;

            this.expect(TokenType.Colon, 'Expected :');
            const varType = this.parseType();

            // Comma is optional for the last field
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
                initializer: null,
            });
        }

        return fields;
    }

    /**
     * Parse type (including generic types like vec3<f32>)
     */
    private parseType(): string {
        let typeStr = '';

        // Get base type
        const baseType = this.stream.next();
        typeStr = baseType.value;

        // Check for generic parameters
        if (this.stream.match(TokenType.Less)) {
            typeStr += this.stream.next().value; // <

            // Parse generic type parameter
            while (!this.stream.match(TokenType.Greater) && !this.stream.isEOF()) {
                typeStr += this.stream.next().value;
            }

            if (this.stream.match(TokenType.Greater)) {
                typeStr += this.stream.next().value; // >
            }
        }

        return typeStr;
    }

    /**
     * Parse variable declaration
     */
    private parseVariableDecl(): VariableDecl {
        const start = this.stream.peek().start;
        this.stream.next(); // var, let, or const

        const nameToken = this.expect(TokenType.Identifier, 'Expected variable name');
        const name = nameToken?.value || '';

        this.expect(TokenType.Colon, 'Expected :');
        const varType = this.parseType();

        let initializer: Expression | null = null;
        if (this.stream.match(TokenType.Equal)) {
            this.stream.next();
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
            initializer,
        };
    }

    /**
     * Parse statement list
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
                statements.push(stmt);
            }
        }

        return statements;
    }

    /**
     * Parse statement
     */
    private parseStatement(): Statement | null {
        const start = this.stream.peek().start;

        // Return statement
        if (this.stream.match(TokenType.Return)) {
            this.stream.next();
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

        // Variable declaration
        if (this.stream.match(TokenType.Var) ||
            this.stream.match(TokenType.Let) ||
            this.stream.match(TokenType.Const)) {
            const varDecl = this.parseVariableDecl();
            return {
                type: ASTNodeType.Statement,
                start: varDecl.start,
                end: varDecl.end,
                children: [varDecl],
                kind: 'expression',
            };
        }

        // Expression statement or assignment
        const expression = this.parseExpression();
        this.expect(TokenType.Semicolon, 'Expected ;');

        const end = this.stream.peek().start;
        return {
            type: ASTNodeType.Statement,
            start,
            end,
            children: [expression],
            kind: 'expression',
            expression,
        };
    }

    /**
     * Parse expression
     */
    private parseExpression(): Expression {
        return this.parseAssignmentExpression();
    }

    /**
     * Parse assignment expression
     */
    private parseAssignmentExpression(): Expression {
        const left = this.parseLogicalOrExpression();

        if (this.stream.match(TokenType.Equal)) {
            const start = left.start;
            this.stream.next();
            const right = this.parseAssignmentExpression();
            const end = right.end;

            return {
                type: ASTNodeType.Expression,
                start,
                end,
                children: [left, right],
                kind: 'binary',
                operator: '=',
                left,
                right,
            };
        }

        return left;
    }

    /**
     * Parse logical OR expression
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
     */
    private parseLogicalAndExpression(): Expression {
        let left = this.parseEqualityExpression();

        while (this.stream.match(TokenType.And)) {
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
     */
    private parseRelationalExpression(): Expression {
        let left = this.parseAdditiveExpression();

        while (this.stream.match(TokenType.Less) ||
            this.stream.match(TokenType.LessEqual) ||
            this.stream.match(TokenType.Greater) ||
            this.stream.match(TokenType.GreaterEqual)) {
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
     */
    private parseUnaryExpression(): Expression {
        if (this.stream.match(TokenType.Not) ||
            this.stream.match(TokenType.Minus)) {
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

        return this.parsePrimaryExpression();
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

        // Number literal
        if (this.stream.match(TokenType.NumberLiteral)) {
            const token = this.stream.next();
            return {
                type: ASTNodeType.Expression,
                start,
                end: token.end,
                children: [],
                kind: 'literal',
                value: parseFloat(token.value),
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

        // Type constructor or function call (vec4<f32>(...), vec3(...), etc.)
        // Check for type keywords that can be used as constructors
        const isTypeKeyword = this.stream.match(TokenType.Vec2) ||
            this.stream.match(TokenType.Vec3) ||
            this.stream.match(TokenType.Vec4) ||
            this.stream.match(TokenType.Mat2x2) ||
            this.stream.match(TokenType.Mat3x3) ||
            this.stream.match(TokenType.Mat4x4) ||
            this.stream.match(TokenType.F32) ||
            this.stream.match(TokenType.I32) ||
            this.stream.match(TokenType.U32) ||
            this.stream.match(TokenType.Bool);

        if (isTypeKeyword) {
            const token = this.stream.next();
            let calleeName = token.value;

            // Check for generic parameters (e.g., vec4<f32>)
            if (this.stream.match(TokenType.Less)) {
                calleeName += this.stream.next().value; // <
                while (!this.stream.match(TokenType.Greater) && !this.stream.isEOF()) {
                    calleeName += this.stream.next().value;
                }
                if (this.stream.match(TokenType.Greater)) {
                    calleeName += this.stream.next().value; // >
                }
            }

            // Check for function call
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
                    callee: calleeName,
                    arguments: args,
                };
            }

            // Just a type reference (shouldn't happen in expressions, but handle it)
            return {
                type: ASTNodeType.Expression,
                start,
                end: token.end,
                children: [],
                kind: 'identifier',
                value: calleeName,
            };
        }

        // Identifier or function call
        if (this.stream.match(TokenType.Identifier)) {
            const token = this.stream.next();

            // Function call
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
                    callee: token.value,
                    arguments: args,
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
    private skipToNextDeclaration(): void {
        while (!this.stream.isEOF()) {
            const token = this.stream.peek();
            if (token.type === TokenType.Fn ||
                token.type === TokenType.Struct ||
                token.type === TokenType.Var ||
                token.type === TokenType.Let ||
                token.type === TokenType.Const) {
                break;
            }
            this.stream.next();
        }
    }
}
