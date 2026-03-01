/**
 * Example property-based tests using the WGSL arbitraries
 * 
 * This file demonstrates how to use the code generators for property-based testing.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
    identifierArbitrary,
    typeArbitrary,
    variableDeclArbitrary,
    functionDeclArbitrary,
    structDeclArbitrary,
    wgslCodeArbitrary,
    commentArbitrary,
} from './arbitraries';

describe('WGSL Arbitraries', () => {
    it('should generate valid identifiers', () => {
        fc.assert(
            fc.property(identifierArbitrary(), (identifier) => {
                // Valid identifier pattern: starts with letter or underscore
                expect(identifier).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
                // Should not be a keyword
                const keywords = ['fn', 'var', 'let', 'struct', 'if', 'return'];
                expect(keywords).not.toContain(identifier);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid types', () => {
        fc.assert(
            fc.property(typeArbitrary(), (type) => {
                // Should match scalar, vector, or matrix type patterns
                const validPattern = /^(f32|i32|u32|bool|vec[234]<(f32|i32|u32|bool)>|mat[234]x[234]<f32>)$/;
                expect(type).toMatch(validPattern);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid variable declarations', () => {
        fc.assert(
            fc.property(variableDeclArbitrary(), (varDecl) => {
                // Should start with 'var' and end with semicolon
                expect(varDecl).toMatch(/^var\s+\w+:\s+\S+/);
                expect(varDecl).toMatch(/;$/);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid function declarations', () => {
        fc.assert(
            fc.property(functionDeclArbitrary(), (funcDecl) => {
                // Should start with 'fn' and contain braces
                expect(funcDecl).toMatch(/^fn\s+\w+\(/);
                expect(funcDecl).toContain('{');
                expect(funcDecl).toContain('}');
                expect(funcDecl).toContain('return');
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid struct declarations', () => {
        fc.assert(
            fc.property(structDeclArbitrary(), (structDecl) => {
                // Should start with 'struct' and contain braces
                expect(structDecl).toMatch(/^struct\s+\w+\s*{/);
                expect(structDecl).toContain('}');
                // Should have at least one field
                expect(structDecl).toMatch(/:\s+\S+,/);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate valid comments', () => {
        fc.assert(
            fc.property(commentArbitrary(), (comment) => {
                // Should be either line comment or block comment
                const isLineComment = comment.startsWith('//');
                const isBlockComment = comment.startsWith('/*') && comment.endsWith('*/');
                expect(isLineComment || isBlockComment).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    it('should generate complete WGSL code', () => {
        fc.assert(
            fc.property(wgslCodeArbitrary(), (code) => {
                // Should be non-empty
                expect(code.length).toBeGreaterThan(0);
                // Should contain at least one declaration
                const hasDeclaration =
                    code.includes('fn ') ||
                    code.includes('struct ') ||
                    code.includes('var ') ||
                    code.includes('//') ||
                    code.includes('/*');
                expect(hasDeclaration).toBe(true);
            }),
            { numRuns: 50 }
        );
    });
});
