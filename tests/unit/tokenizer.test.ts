import { describe, it, expect } from 'vitest';
import { Tokenizer, TokenType, TokenStream } from '../../src/tokenizer';

describe('Tokenizer', () => {
    it('should tokenize keywords', () => {
        const tokenizer = new Tokenizer('fn struct var let const return');
        const tokens = tokenizer.tokenize();
        
        expect(tokens).toHaveLength(6);
        expect(tokens[0].type).toBe(TokenType.Fn);
        expect(tokens[1].type).toBe(TokenType.Struct);
        expect(tokens[2].type).toBe(TokenType.Var);
        expect(tokens[3].type).toBe(TokenType.Let);
        expect(tokens[4].type).toBe(TokenType.Const);
        expect(tokens[5].type).toBe(TokenType.Return);
    });

    it('should tokenize identifiers', () => {
        const tokenizer = new Tokenizer('myVar _test test123');
        const tokens = tokenizer.tokenize();
        
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.Identifier);
        expect(tokens[0].value).toBe('myVar');
        expect(tokens[1].type).toBe(TokenType.Identifier);
        expect(tokens[1].value).toBe('_test');
        expect(tokens[2].type).toBe(TokenType.Identifier);
        expect(tokens[2].value).toBe('test123');
    });

    it('should tokenize number literals', () => {
        const tokenizer = new Tokenizer('42 3.14 1.5e-10');
        const tokens = tokenizer.tokenize();
        
        expect(tokens).toHaveLength(3);
        expect(tokens[0].type).toBe(TokenType.NumberLiteral);
        expect(tokens[0].value).toBe('42');
        expect(tokens[1].type).toBe(TokenType.NumberLiteral);
        expect(tokens[1].value).toBe('3.14');
        expect(tokens[2].type).toBe(TokenType.NumberLiteral);
        expect(tokens[2].value).toBe('1.5e-10');
    });

    it('should tokenize operators', () => {
        const tokenizer = new Tokenizer('+ - * / % == != < <= > >= && ||');
        const tokens = tokenizer.tokenize();
        
        expect(tokens).toHaveLength(13);
        expect(tokens[0].type).toBe(TokenType.Plus);
        expect(tokens[1].type).toBe(TokenType.Minus);
        expect(tokens[2].type).toBe(TokenType.Star);
        expect(tokens[3].type).toBe(TokenType.Slash);
        expect(tokens[4].type).toBe(TokenType.Percent);
        expect(tokens[5].type).toBe(TokenType.EqualEqual);
        expect(tokens[6].type).toBe(TokenType.NotEqual);
        expect(tokens[7].type).toBe(TokenType.Less);
        expect(tokens[8].type).toBe(TokenType.LessEqual);
        expect(tokens[9].type).toBe(TokenType.Greater);
        expect(tokens[10].type).toBe(TokenType.GreaterEqual);
        expect(tokens[11].type).toBe(TokenType.And);
        expect(tokens[12].type).toBe(TokenType.Or);
    });

    it('should tokenize punctuation', () => {
        const tokenizer = new Tokenizer('( ) { } [ ] ; : , . ->');
        const tokens = tokenizer.tokenize();
        
        expect(tokens).toHaveLength(11);
        expect(tokens[0].type).toBe(TokenType.LeftParen);
        expect(tokens[1].type).toBe(TokenType.RightParen);
        expect(tokens[2].type).toBe(TokenType.LeftBrace);
        expect(tokens[3].type).toBe(TokenType.RightBrace);
        expect(tokens[4].type).toBe(TokenType.LeftBracket);
        expect(tokens[5].type).toBe(TokenType.RightBracket);
        expect(tokens[6].type).toBe(TokenType.Semicolon);
        expect(tokens[7].type).toBe(TokenType.Colon);
        expect(tokens[8].type).toBe(TokenType.Comma);
        expect(tokens[9].type).toBe(TokenType.Dot);
        expect(tokens[10].type).toBe(TokenType.Arrow);
    });

    it('should tokenize line comments', () => {
        const tokenizer = new Tokenizer('// This is a comment\nfn test() {}');
        const tokens = tokenizer.tokenize();
        
        expect(tokens[0].type).toBe(TokenType.Comment);
        expect(tokens[0].value).toBe('// This is a comment');
        expect(tokens[1].type).toBe(TokenType.Fn);
    });

    it('should tokenize block comments', () => {
        const tokenizer = new Tokenizer('/* Block comment */fn test() {}');
        const tokens = tokenizer.tokenize();
        
        expect(tokens[0].type).toBe(TokenType.Comment);
        expect(tokens[0].value).toBe('/* Block comment */');
        expect(tokens[1].type).toBe(TokenType.Fn);
    });

    it('should track position information', () => {
        const tokenizer = new Tokenizer('fn test');
        const tokens = tokenizer.tokenize();
        
        expect(tokens[0].start.line).toBe(1);
        expect(tokens[0].start.column).toBe(0);
        expect(tokens[1].start.line).toBe(1);
        expect(tokens[1].start.column).toBeGreaterThan(0);
    });

    it('should handle multiline input', () => {
        const tokenizer = new Tokenizer('fn test()\n{\n    return;\n}');
        const tokens = tokenizer.tokenize();
        
        expect(tokens.length).toBeGreaterThanOrEqual(7);
        expect(tokens[0].type).toBe(TokenType.Fn);
        const lastToken = tokens[tokens.length - 1];
        expect(lastToken.type).toBe(TokenType.RightBrace);
    });
});

describe('TokenStream', () => {
    it('should peek without advancing', () => {
        const tokenizer = new Tokenizer('fn test');
        const tokens = tokenizer.tokenize();
        const stream = new TokenStream(tokens);
        
        const first = stream.peek();
        expect(first.type).toBe(TokenType.Fn);
        
        const stillFirst = stream.peek();
        expect(stillFirst.type).toBe(TokenType.Fn);
    });

    it('should advance with next', () => {
        const tokenizer = new Tokenizer('fn test');
        const tokens = tokenizer.tokenize();
        const stream = new TokenStream(tokens);
        
        const first = stream.next();
        expect(first.type).toBe(TokenType.Fn);
        
        const second = stream.peek();
        expect(second.type).toBe(TokenType.Identifier);
    });

    it('should match token types', () => {
        const tokenizer = new Tokenizer('fn test');
        const tokens = tokenizer.tokenize();
        const stream = new TokenStream(tokens);
        
        expect(stream.match(TokenType.Fn)).toBe(true);
        expect(stream.match(TokenType.Struct)).toBe(false);
    });

    it('should consume matching tokens', () => {
        const tokenizer = new Tokenizer('fn test');
        const tokens = tokenizer.tokenize();
        const stream = new TokenStream(tokens);
        
        const consumed = stream.consume(TokenType.Fn);
        expect(consumed).not.toBeNull();
        expect(consumed?.type).toBe(TokenType.Fn);
        
        const notConsumed = stream.consume(TokenType.Struct);
        expect(notConsumed).toBeNull();
    });

    it('should detect EOF', () => {
        const tokenizer = new Tokenizer('fn');
        const tokens = tokenizer.tokenize();
        const stream = new TokenStream(tokens);
        
        expect(stream.isEOF()).toBe(false);
        stream.next();
        expect(stream.isEOF()).toBe(true);
    });
});
