/**
 * Tokenizer for WGSL (WebGPU Shading Language)
 * Performs lexical analysis and generates token stream.
 *
 * Spec Reference: SPEC.md §10 - Keywords, operators, and tokens
 */

import { Position } from './ast';

/**
 * Token types - complete WGSL token set
 * Spec: §10 WGSL 关键字与运算符完整列表
 */
export enum TokenType {
    // Keywords
    Fn = 'fn',
    Struct = 'struct',
    Var = 'var',
    Let = 'let',
    Const = 'const',
    Override = 'override',
    Return = 'return',
    If = 'if',
    Else = 'else',
    For = 'for',
    While = 'while',
    Loop = 'loop',
    Switch = 'switch',
    Case = 'case',
    Default = 'default',
    Break = 'break',
    Continue = 'continue',
    Enable = 'enable',
    Diagnostic = 'diagnostic',
    Alias = 'alias',

    // Scalar types
    F32 = 'f32',
    I32 = 'i32',
    U32 = 'u32',
    Bool = 'bool',
    F16 = 'f16',

    // Vector types
    Vec2 = 'vec2',
    Vec3 = 'vec3',
    Vec4 = 'vec4',

    // Matrix types
    Mat2x2 = 'mat2x2',
    Mat3x3 = 'mat3x3',
    Mat4x4 = 'mat4x4',
    Mat2x3 = 'mat2x3',
    Mat2x4 = 'mat2x4',
    Mat3x2 = 'mat3x2',
    Mat3x4 = 'mat3x4',
    Mat4x2 = 'mat4x2',
    Mat4x3 = 'mat4x3',

    // Special types
    Array = 'array',
    Ptr = 'ptr',
    Atomic = 'atomic',
    Sampler = 'sampler',
    SamplerComparison = 'sampler_comparison',

    // Literals
    Identifier = 'Identifier',
    NumberLiteral = 'NumberLiteral',
    BoolLiteral = 'BoolLiteral',

    // Arithmetic operators
    Plus = '+',
    Minus = '-',
    Star = '*',
    Slash = '/',
    Percent = '%',

    // Comparison operators
    EqualEqual = '==',
    NotEqual = '!=',
    Less = '<',
    LessEqual = '<=',
    Greater = '>',
    GreaterEqual = '>=',

    // Logical operators
    And = '&&',
    Or = '||',
    Not = '!',

    // Bitwise operators
    BitwiseAnd = '&',
    BitwiseOr = '|',
    BitwiseXor = '^',
    BitwiseNot = '~',
    ShiftLeft = '<<',
    ShiftRight = '>>',

    // Assignment operators
    Equal = '=',
    PlusEqual = '+=',
    MinusEqual = '-=',
    StarEqual = '*=',
    SlashEqual = '/=',
    PercentEqual = '%=',
    AndEqual = '&=',
    OrEqual = '|=',
    XorEqual = '^=',
    ShiftLeftEqual = '<<=',
    ShiftRightEqual = '>>=',

    // Increment/Decrement
    PlusPlus = '++',
    MinusMinus = '--',

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
    Underscore = '_',

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
 * WGSL keywords - maps string values to TokenTypes
 */
const KEYWORDS: Map<string, TokenType> = new Map([
    // Declarations
    ['fn', TokenType.Fn],
    ['struct', TokenType.Struct],
    ['var', TokenType.Var],
    ['let', TokenType.Let],
    ['const', TokenType.Const],
    ['override', TokenType.Override],
    ['alias', TokenType.Alias],
    ['enable', TokenType.Enable],
    ['diagnostic', TokenType.Diagnostic],

    // Control flow
    ['return', TokenType.Return],
    ['if', TokenType.If],
    ['else', TokenType.Else],
    ['for', TokenType.For],
    ['while', TokenType.While],
    ['loop', TokenType.Loop],
    ['switch', TokenType.Switch],
    ['case', TokenType.Case],
    ['default', TokenType.Default],
    ['break', TokenType.Break],
    ['continue', TokenType.Continue],

    // Scalar types
    ['f32', TokenType.F32],
    ['i32', TokenType.I32],
    ['u32', TokenType.U32],
    ['bool', TokenType.Bool],
    ['f16', TokenType.F16],

    // Vector types
    ['vec2', TokenType.Vec2],
    ['vec3', TokenType.Vec3],
    ['vec4', TokenType.Vec4],

    // Matrix types
    ['mat2x2', TokenType.Mat2x2],
    ['mat3x3', TokenType.Mat3x3],
    ['mat4x4', TokenType.Mat4x4],
    ['mat2x3', TokenType.Mat2x3],
    ['mat2x4', TokenType.Mat2x4],
    ['mat3x2', TokenType.Mat3x2],
    ['mat3x4', TokenType.Mat3x4],
    ['mat4x2', TokenType.Mat4x2],
    ['mat4x3', TokenType.Mat4x3],

    // Special types
    ['array', TokenType.Array],
    ['ptr', TokenType.Ptr],
    ['atomic', TokenType.Atomic],
    ['sampler', TokenType.Sampler],
    ['sampler_comparison', TokenType.SamplerComparison],

    // Booleans
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
        const ch = this.peek();
        const next = this.peekNext();

        // Single-line comments: //
        if (ch === '/' && next === '/') {
            return this.readLineComment(start);
        }
        // Block comments: /* ... */
        if (ch === '/' && next === '*') {
            return this.readBlockComment(start);
        }

        // Identifiers and keywords
        if (this.isIdentifierStart(ch)) {
            return this.readIdentifierOrKeyword(start);
        }

        // Hex integer literals: 0x...
        if (ch === '0' && (next === 'x' || next === 'X')) {
            return this.readHexNumber(start);
        }

        // Decimal number literals
        if (this.isDigit(ch) || (ch === '.' && next && this.isDigit(next))) {
            return this.readNumber(start);
        }

        // Operators and punctuation
        return this.readOperatorOrPunctuation(start);
    }

    private readLineComment(start: Position): Token {
        let value = '//';
        this.advance(); // /
        this.advance(); // /
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

    private readIdentifierOrKeyword(start: Position): Token {
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

    private readHexNumber(start: Position): Token {
        let value = '0x';
        this.advance(); // 0
        this.advance(); // x
        while (!this.isEOF() && /[0-9a-fA-F]/.test(this.peek())) {
            value += this.advance();
        }
        return {
            type: TokenType.NumberLiteral,
            value,
            start,
            end: this.getPosition(),
        };
    }

    private readNumber(start: Position): Token {
        let value = '';

        // Handle numbers starting with .
        if (this.peek() === '.') {
            value += this.advance();
        }

        while (!this.isEOF() && (this.isDigit(this.peek()) || this.peek() === '.')) {
            value += this.advance();
        }

        // Scientific notation (e.g., 1.5e-10)
        if (!this.isEOF() && (this.peek() === 'e' || this.peek() === 'E')) {
            value += this.advance();
            if (!this.isEOF() && (this.peek() === '+' || this.peek() === '-')) {
                value += this.advance();
            }
            while (!this.isEOF() && this.isDigit(this.peek())) {
                value += this.advance();
            }
        }

        // Literal suffix (e.g., 1.0f, 10u)
        if (!this.isEOF() && (this.peek() === 'f' || this.peek() === 'u' || this.peek() === 'i')) {
            const nextChar = this.peekNext();
            if (!this.isIdentifierPart(nextChar) || nextChar === '') {
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

        // Two-character operators (longest first)
        // Shift left equal
        if (ch === '<' && next === '<' && this.peekNextNext() === '=') {
            this.advance(); this.advance(); this.advance();
            return { type: TokenType.ShiftLeftEqual, value: '<<=', start, end: this.getPosition() };
        }
        // Shift right equal
        if (ch === '>' && next === '>' && this.peekNextNext() === '=') {
            this.advance(); this.advance(); this.advance();
            return { type: TokenType.ShiftRightEqual, value: '>>=', start, end: this.getPosition() };
        }

        // Two-character operators
        const twoCharMap: Record<string, TokenType> = {
            '==': TokenType.EqualEqual,
            '!=': TokenType.NotEqual,
            '<=': TokenType.LessEqual,
            '>=': TokenType.GreaterEqual,
            '&&': TokenType.And,
            '||': TokenType.Or,
            '->': TokenType.Arrow,
            '<<': TokenType.ShiftLeft,
            '>>': TokenType.ShiftRight,
            '++': TokenType.PlusPlus,
            '--': TokenType.MinusMinus,
            '+=': TokenType.PlusEqual,
            '-=': TokenType.MinusEqual,
            '*=': TokenType.StarEqual,
            '/=': TokenType.SlashEqual,
            '%=': TokenType.PercentEqual,
            '&=': TokenType.AndEqual,
            '|=': TokenType.OrEqual,
            '^=': TokenType.XorEqual,
        };

        const twoChar = ch + next;
        if (twoChar in twoCharMap) {
            this.advance();
            this.advance();
            return { type: twoCharMap[twoChar], value: twoChar, start, end: this.getPosition() };
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
            '&': TokenType.BitwiseAnd,
            '|': TokenType.BitwiseOr,
            '^': TokenType.BitwiseXor,
            '~': TokenType.BitwiseNot,
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
            '_': TokenType.Underscore,
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

    private peekNextNext(): string {
        return this.source[this.position + 2] || '';
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
