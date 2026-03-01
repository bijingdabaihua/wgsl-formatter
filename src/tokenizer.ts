/**
 * Tokenizer for WGSL (WebGPU Shading Language)
 * Performs lexical analysis and generates token stream
 */

import { Position } from './ast';

/**
 * Token types
 */
export enum TokenType {
    // Keywords
    Fn = 'fn',
    Struct = 'struct',
    Var = 'var',
    Let = 'let',
    Const = 'const',
    Return = 'return',
    If = 'if',
    Else = 'else',
    For = 'for',
    While = 'while',
    Break = 'break',
    Continue = 'continue',
    
    // Types
    F32 = 'f32',
    I32 = 'i32',
    U32 = 'u32',
    Bool = 'bool',
    Vec2 = 'vec2',
    Vec3 = 'vec3',
    Vec4 = 'vec4',
    Mat2x2 = 'mat2x2',
    Mat3x3 = 'mat3x3',
    Mat4x4 = 'mat4x4',
    
    // Literals
    Identifier = 'Identifier',
    NumberLiteral = 'NumberLiteral',
    BoolLiteral = 'BoolLiteral',
    
    // Operators
    Plus = '+',
    Minus = '-',
    Star = '*',
    Slash = '/',
    Percent = '%',
    Equal = '=',
    EqualEqual = '==',
    NotEqual = '!=',
    Less = '<',
    LessEqual = '<=',
    Greater = '>',
    GreaterEqual = '>=',
    And = '&&',
    Or = '||',
    Not = '!',
    
    // Punctuation
    LeftParen = '(',
    RightParen = ')',
    LeftBrace = '{',
    RightBrace = '}',
    LeftBracket = '[',
    RightBracket = ']',
    Semicolon = ';',
    Colon = ':',
    Comma = ',',
    Dot = '.',
    Arrow = '->',
    At = '@',
    
    // Special
    Comment = 'Comment',
    Whitespace = 'Whitespace',
    Newline = 'Newline',
    EOF = 'EOF',
}

/**
 * Token interface
 */
export interface Token {
    type: TokenType;
    value: string;
    start: Position;
    end: Position;
}

/**
 * WGSL keywords
 */
const KEYWORDS: Map<string, TokenType> = new Map([
    ['fn', TokenType.Fn],
    ['struct', TokenType.Struct],
    ['var', TokenType.Var],
    ['let', TokenType.Let],
    ['const', TokenType.Const],
    ['return', TokenType.Return],
    ['if', TokenType.If],
    ['else', TokenType.Else],
    ['for', TokenType.For],
    ['while', TokenType.While],
    ['break', TokenType.Break],
    ['continue', TokenType.Continue],
    ['f32', TokenType.F32],
    ['i32', TokenType.I32],
    ['u32', TokenType.U32],
    ['bool', TokenType.Bool],
    ['vec2', TokenType.Vec2],
    ['vec3', TokenType.Vec3],
    ['vec4', TokenType.Vec4],
    ['mat2x2', TokenType.Mat2x2],
    ['mat3x3', TokenType.Mat3x3],
    ['mat4x4', TokenType.Mat4x4],
    ['true', TokenType.BoolLiteral],
    ['false', TokenType.BoolLiteral],
]);

/**
 * TokenStream class for managing token iteration
 */
export class TokenStream {
    private tokens: Token[];
    private position: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    /**
     * Get current token without advancing
     */
    peek(): Token {
        return this.tokens[this.position] || this.createEOFToken();
    }

    /**
     * Get current token and advance to next
     */
    next(): Token {
        const token = this.peek();
        if (token.type !== TokenType.EOF) {
            this.position++;
        }
        return token;
    }

    /**
     * Check if current token matches expected type
     */
    match(type: TokenType): boolean {
        return this.peek().type === type;
    }

    /**
     * Consume token if it matches expected type
     */
    consume(type: TokenType): Token | null {
        if (this.match(type)) {
            return this.next();
        }
        return null;
    }

    /**
     * Check if at end of stream
     */
    isEOF(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private createEOFToken(): Token {
        const lastToken = this.tokens[this.tokens.length - 1];
        const pos: Position = lastToken
            ? { ...lastToken.end }
            : { line: 1, column: 0, offset: 0 };
        return {
            type: TokenType.EOF,
            value: '',
            start: pos,
            end: pos,
        };
    }
}

/**
 * Tokenizer class
 */
export class Tokenizer {
    private source: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 0;

    constructor(source: string) {
        this.source = source;
    }

    /**
     * Tokenize the source code
     */
    tokenize(): Token[] {
        const tokens: Token[] = [];

        while (!this.isEOF()) {
            const token = this.nextToken();
            if (token) {
                tokens.push(token);
            }
        }

        return tokens;
    }

    private nextToken(): Token | null {
        this.skipWhitespace();

        if (this.isEOF()) {
            return null;
        }

        const start = this.getPosition();

        // Comments
        if (this.peek() === '/' && this.peekNext() === '/') {
            return this.readLineComment(start);
        }
        if (this.peek() === '/' && this.peekNext() === '*') {
            return this.readBlockComment(start);
        }

        // Identifiers and keywords
        if (this.isIdentifierStart(this.peek())) {
            return this.readIdentifier(start);
        }

        // Numbers
        if (this.isDigit(this.peek())) {
            return this.readNumber(start);
        }

        // Operators and punctuation
        return this.readOperatorOrPunctuation(start);
    }

    private readLineComment(start: Position): Token {
        let value = '';
        while (!this.isEOF() && this.peek() !== '\n') {
            value += this.advance();
        }
        return {
            type: TokenType.Comment,
            value,
            start,
            end: this.getPosition(),
        };
    }

    private readBlockComment(start: Position): Token {
        let value = '';
        this.advance(); // /
        this.advance(); // *
        value = '/*';

        while (!this.isEOF()) {
            if (this.peek() === '*' && this.peekNext() === '/') {
                value += this.advance(); // *
                value += this.advance(); // /
                break;
            }
            value += this.advance();
        }

        return {
            type: TokenType.Comment,
            value,
            start,
            end: this.getPosition(),
        };
    }

    private readIdentifier(start: Position): Token {
        let value = '';
        while (!this.isEOF() && this.isIdentifierPart(this.peek())) {
            value += this.advance();
        }

        const type = KEYWORDS.get(value) || TokenType.Identifier;
        return {
            type,
            value,
            start,
            end: this.getPosition(),
        };
    }

    private readNumber(start: Position): Token {
        let value = '';
        while (!this.isEOF() && (this.isDigit(this.peek()) || this.peek() === '.')) {
            value += this.advance();
        }

        // Handle scientific notation (e.g., 1.5e-10)
        if (!this.isEOF() && (this.peek() === 'e' || this.peek() === 'E')) {
            value += this.advance();
            if (!this.isEOF() && (this.peek() === '+' || this.peek() === '-')) {
                value += this.advance();
            }
            while (!this.isEOF() && this.isDigit(this.peek())) {
                value += this.advance();
            }
        }

        return {
            type: TokenType.NumberLiteral,
            value,
            start,
            end: this.getPosition(),
        };
    }

    private readOperatorOrPunctuation(start: Position): Token {
        const ch = this.peek();
        const next = this.peekNext();

        // Two-character operators
        if (ch === '=' && next === '=') {
            this.advance();
            this.advance();
            return { type: TokenType.EqualEqual, value: '==', start, end: this.getPosition() };
        }
        if (ch === '!' && next === '=') {
            this.advance();
            this.advance();
            return { type: TokenType.NotEqual, value: '!=', start, end: this.getPosition() };
        }
        if (ch === '<' && next === '=') {
            this.advance();
            this.advance();
            return { type: TokenType.LessEqual, value: '<=', start, end: this.getPosition() };
        }
        if (ch === '>' && next === '=') {
            this.advance();
            this.advance();
            return { type: TokenType.GreaterEqual, value: '>=', start, end: this.getPosition() };
        }
        if (ch === '&' && next === '&') {
            this.advance();
            this.advance();
            return { type: TokenType.And, value: '&&', start, end: this.getPosition() };
        }
        if (ch === '|' && next === '|') {
            this.advance();
            this.advance();
            return { type: TokenType.Or, value: '||', start, end: this.getPosition() };
        }
        if (ch === '-' && next === '>') {
            this.advance();
            this.advance();
            return { type: TokenType.Arrow, value: '->', start, end: this.getPosition() };
        }

        // Single-character operators and punctuation
        this.advance();
        const tokenMap: Record<string, TokenType> = {
            '+': TokenType.Plus,
            '-': TokenType.Minus,
            '*': TokenType.Star,
            '/': TokenType.Slash,
            '%': TokenType.Percent,
            '=': TokenType.Equal,
            '<': TokenType.Less,
            '>': TokenType.Greater,
            '!': TokenType.Not,
            '(': TokenType.LeftParen,
            ')': TokenType.RightParen,
            '{': TokenType.LeftBrace,
            '}': TokenType.RightBrace,
            '[': TokenType.LeftBracket,
            ']': TokenType.RightBracket,
            ';': TokenType.Semicolon,
            ':': TokenType.Colon,
            ',': TokenType.Comma,
            '.': TokenType.Dot,
            '@': TokenType.At,
        };

        const type = tokenMap[ch];
        if (type) {
            return { type, value: ch, start, end: this.getPosition() };
        }

        // Unknown character - return as identifier for error recovery
        return {
            type: TokenType.Identifier,
            value: ch,
            start,
            end: this.getPosition(),
        };
    }

    private skipWhitespace(): void {
        while (!this.isEOF() && this.isWhitespace(this.peek())) {
            this.advance();
        }
    }

    private isWhitespace(ch: string): boolean {
        return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
    }

    private isIdentifierStart(ch: string): boolean {
        return /[a-zA-Z_]/.test(ch);
    }

    private isIdentifierPart(ch: string): boolean {
        return /[a-zA-Z0-9_]/.test(ch);
    }

    private isDigit(ch: string): boolean {
        return /[0-9]/.test(ch);
    }

    private peek(): string {
        return this.source[this.position] || '';
    }

    private peekNext(): string {
        return this.source[this.position + 1] || '';
    }

    private advance(): string {
        const ch = this.peek();
        this.position++;
        if (ch === '\n') {
            this.line++;
            this.column = 0;
        } else {
            this.column++;
        }
        return ch;
    }

    private isEOF(): boolean {
        return this.position >= this.source.length;
    }

    private getPosition(): Position {
        return {
            line: this.line,
            column: this.column,
            offset: this.position,
        };
    }
}
