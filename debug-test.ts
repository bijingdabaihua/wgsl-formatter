import { WGSLParser } from './src/parser';

const code = `fn main() -> vec4<f32> {
   return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}`;

console.log('Testing WGSL code:');
console.log(code);
console.log('\n---\n');

const parser = new WGSLParser();
const result = parser.parse(code);

console.log('Parse result:');
console.log('AST:', result.ast ? 'Generated' : 'NULL');
console.log('Errors:', result.errors);

if (result.errors.length > 0) {
    console.log('\nDetailed errors:');
    result.errors.forEach((err, i) => {
        console.log(`${i + 1}. Line ${err.line}, Column ${err.column}: ${err.message}`);
    });
}

if (result.ast) {
    console.log('\nAST structure:');
    console.log(JSON.stringify(result.ast, null, 2));
}
