import { describe, it, expect } from 'vitest';
import { WGSLParser } from '../../src/parser';
import { ASTNodeType } from '../../src/ast';

describe('WGSLParser', () => {
    it('should parse an empty program', () => {
        const parser = new WGSLParser();
        const result = parser.parse('');
        
        expect(result.ast).not.toBeNull();
        expect(result.ast?.type).toBe(ASTNodeType.Program);
        expect(result.ast?.declarations).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
    });

    it('should parse a simple function declaration', () => {
        const parser = new WGSLParser();
        const source = `fn main() {
    return;
}`;
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        expect(result.ast?.declarations).toHaveLength(1);
        expect(result.ast?.declarations[0].type).toBe(ASTNodeType.FunctionDecl);
        
        const funcDecl = result.ast?.declarations[0];
        if (funcDecl && funcDecl.type === ASTNodeType.FunctionDecl) {
            expect(funcDecl.name).toBe('main');
            expect(funcDecl.parameters).toHaveLength(0);
            expect(funcDecl.returnType).toBeNull();
        }
    });

    it('should parse a struct declaration', () => {
        const parser = new WGSLParser();
        const source = `struct Vertex {
    position: vec3,
    color: vec4,
}`;
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        expect(result.ast?.declarations).toHaveLength(1);
        expect(result.ast?.declarations[0].type).toBe(ASTNodeType.StructDecl);
        
        const structDecl = result.ast?.declarations[0];
        if (structDecl && structDecl.type === ASTNodeType.StructDecl) {
            expect(structDecl.name).toBe('Vertex');
            expect(structDecl.fields).toHaveLength(2);
            expect(structDecl.fields[0].name).toBe('position');
            expect(structDecl.fields[0].varType).toBe('vec3');
        }
    });

    it('should parse variable declarations', () => {
        const parser = new WGSLParser();
        const source = 'var x: f32;';
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        expect(result.ast?.declarations).toHaveLength(1);
        expect(result.ast?.declarations[0].type).toBe(ASTNodeType.VariableDecl);
        
        const varDecl = result.ast?.declarations[0];
        if (varDecl && varDecl.type === ASTNodeType.VariableDecl) {
            expect(varDecl.name).toBe('x');
            expect(varDecl.varType).toBe('f32');
            expect(varDecl.initializer).toBeNull();
        }
    });

    it('should parse comments', () => {
        const parser = new WGSLParser();
        const source = `// Line comment
/* Block comment */
fn test() {}`;
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        expect(result.ast?.declarations).toHaveLength(3);
        expect(result.ast?.declarations[0].type).toBe(ASTNodeType.Comment);
        expect(result.ast?.declarations[1].type).toBe(ASTNodeType.Comment);
        expect(result.ast?.declarations[2].type).toBe(ASTNodeType.FunctionDecl);
    });

    it('should handle syntax errors with error recovery', () => {
        const parser = new WGSLParser();
        const source = `fn invalid( {
fn valid() {}`;
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        expect(result.errors.length).toBeGreaterThan(0);
        // Should still parse the valid function
        expect(result.ast?.declarations.length).toBeGreaterThan(0);
    });

    it('should track position information', () => {
        const parser = new WGSLParser();
        const source = 'fn test() {}';
        const result = parser.parse(source);
        
        expect(result.ast).not.toBeNull();
        const funcDecl = result.ast?.declarations[0];
        expect(funcDecl?.start).toBeDefined();
        expect(funcDecl?.end).toBeDefined();
        expect(funcDecl?.start.line).toBe(1);
        expect(funcDecl?.start.column).toBeGreaterThanOrEqual(0);
    });
});
