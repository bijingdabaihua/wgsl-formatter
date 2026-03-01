import { describe, it, expect } from 'vitest';
import { WGSLParser } from '../../src/parser';
import { ASTNodeType } from '../../src/ast';

describe('WGSLParser - Generic Types', () => {
    it('should parse function with generic return type vec4<f32>', () => {
        const parser = new WGSLParser();
        const source = `fn main() -> vec4<f32> {
   return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}`;
        const result = parser.parse(source);

        console.log('Parse result:', {
            hasAST: !!result.ast,
            errors: result.errors,
            declarations: result.ast?.declarations.length
        });

        if (result.errors.length > 0) {
            console.log('Errors found:');
            result.errors.forEach((err, i) => {
                console.log(`  ${i + 1}. Line ${err.line}, Col ${err.column}: ${err.message}`);
            });
        }

        expect(result.ast).not.toBeNull();
        expect(result.errors).toHaveLength(0);
        expect(result.ast?.declarations).toHaveLength(1);

        const funcDecl = result.ast?.declarations[0];
        if (funcDecl && funcDecl.type === ASTNodeType.FunctionDecl) {
            expect(funcDecl.name).toBe('main');
            expect(funcDecl.returnType).toBe('vec4<f32>');
        }
    });

    it('should parse vec3<f32> type', () => {
        const parser = new WGSLParser();
        const source = `fn test() -> vec3<f32> {
    return vec3<f32>(0.0, 0.0, 0.0);
}`;
        const result = parser.parse(source);

        expect(result.ast).not.toBeNull();
        expect(result.errors).toHaveLength(0);

        const funcDecl = result.ast?.declarations[0];
        if (funcDecl && funcDecl.type === ASTNodeType.FunctionDecl) {
            expect(funcDecl.returnType).toBe('vec3<f32>');
        }
    });

    it('should parse function parameters with generic types', () => {
        const parser = new WGSLParser();
        const source = `fn test(pos: vec3<f32>, color: vec4<f32>) -> f32 {
    return 1.0;
}`;
        const result = parser.parse(source);

        expect(result.ast).not.toBeNull();
        expect(result.errors).toHaveLength(0);

        const funcDecl = result.ast?.declarations[0];
        if (funcDecl && funcDecl.type === ASTNodeType.FunctionDecl) {
            expect(funcDecl.parameters).toHaveLength(2);
            expect(funcDecl.parameters[0].varType).toBe('vec3<f32>');
            expect(funcDecl.parameters[1].varType).toBe('vec4<f32>');
        }
    });
});
