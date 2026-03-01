// 快速调试脚本
const { WGSLParser } = require('./dist/parser');
const { Tokenizer } = require('./dist/tokenizer');

const code = `fn main() -> vec4<f32> {
   return vec4<f32>(1.0, 1.0, 1.0, 1.0);
}`;

console.log('=== Testing Tokenizer ===');
try {
    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();
    console.log('Tokens generated:', tokens.length);
    tokens.forEach((token, i) => {
        if (token.type !== 'Whitespace' && token.type !== 'Newline') {
            console.log(`${i}: ${token.type} = "${token.value}"`);
        }
    });
} catch (error) {
    console.error('Tokenizer error:', error.message);
}

console.log('\n=== Testing Parser ===');
try {
    const parser = new WGSLParser();
    const result = parser.parse(code);
    console.log('AST generated:', result.ast ? 'YES' : 'NO');
    console.log('Errors:', result.errors.length);
    if (result.errors.length > 0) {
        result.errors.forEach((err, i) => {
            console.log(`  Error ${i + 1}: Line ${err.line}, Col ${err.column}: ${err.message}`);
        });
    }
} catch (error) {
    console.error('Parser error:', error.message);
}
