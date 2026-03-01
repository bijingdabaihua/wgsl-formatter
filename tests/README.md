# WGSL Formatter Test Suite

This directory contains the test suite for the WGSL Formatter VSCode Extension.

## Directory Structure

```
tests/
├── fixtures/          # Test fixture files
│   ├── valid/        # Valid WGSL code samples
│   └── invalid/      # Invalid WGSL code with syntax errors
├── property/         # Property-based tests
│   ├── arbitraries.ts    # Code generators for fast-check
│   └── example.test.ts   # Example property tests
└── unit/             # Unit tests
    ├── config.test.ts
    ├── errors.test.ts
    ├── formatter.test.ts
    ├── parser.test.ts
    ├── provider.test.ts
    ├── tokenizer.test.ts
    ├── newline.test.ts
    └── timeout.test.ts
```

## Test Fixtures

### Valid Fixtures (`fixtures/valid/`)

These files contain syntactically correct WGSL code for testing the formatter:

- `simple-function.wgsl` - Basic function declaration
- `struct-declaration.wgsl` - Structure definitions
- `function-with-params.wgsl` - Functions with parameters and return types
- `comments.wgsl` - Line and block comments
- `operators.wgsl` - Various operators and expressions
- `control-flow.wgsl` - If/else, loops, and control flow
- `variables.wgsl` - Variable declarations with different storage classes
- `complex-shader.wgsl` - Complete shader with vertex and fragment stages
- `whitespace-edge-cases.wgsl` - Poorly formatted code for testing
- `empty.wgsl` - Empty file edge case

### Invalid Fixtures (`fixtures/invalid/`)

These files contain syntax errors for testing error handling:

- `invalid-operator.wgsl` - Invalid operator usage
- `invalid-struct.wgsl` - Missing comma in struct
- `missing-paren.wgsl` - Unclosed parenthesis
- `unexpected-token.wgsl` - Unexpected token in expression
- `unclosed-comment.wgsl` - Block comment not closed
- `missing-semicolon.wgsl` - Missing statement terminator
- `invalid-type.wgsl` - Unknown type name
- `unclosed-brace.wgsl` - Missing closing brace
- `missing-return-type.wgsl` - Malformed return type

## Property-Based Testing

### Arbitraries (`property/arbitraries.ts`)

The arbitraries module provides code generators for property-based testing with fast-check:

#### Basic Generators

- `identifierArbitrary()` - Valid WGSL identifiers
- `typeArbitrary()` - WGSL types (scalar, vector, matrix)
- `literalArbitrary(type?)` - Literal values
- `expressionArbitrary()` - Simple expressions
- `longExpressionArbitrary()` - Long expressions for line wrapping tests

#### Declaration Generators

- `variableDeclArbitrary()` - Variable declarations
- `letDeclArbitrary()` - Constant declarations
- `functionDeclArbitrary()` - Function declarations
- `structDeclArbitrary()` - Struct declarations
- `commentArbitrary()` - Comments (line and block)

#### Complete Code Generators

- `wgslCodeArbitrary()` - Complete WGSL programs
- `wgslCodeWithCharacteristics(options)` - Code with specific features
- `unformattedWgslArbitrary()` - Poorly formatted code

### Usage Example

```typescript
import fc from 'fast-check';
import { wgslCodeArbitrary } from './property/arbitraries';
import { format } from '../src/formatter';

// Feature: wgsl-formatter-vscode-extension, Property 1: 格式化往返保持语义
it('should preserve semantics after format round-trip', () => {
    fc.assert(
        fc.property(wgslCodeArbitrary(), (code) => {
            const ast1 = parse(code);
            const formatted = format(code);
            const ast2 = parse(formatted);
            expect(astEqual(ast1, ast2)).toBe(true);
        }),
        { numRuns: 100 }
    );
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only unit tests
npm test -- tests/unit

# Run only property tests
npm test -- tests/property
```

## Test Configuration

Tests are configured in `vitest.config.ts` at the project root.

## Writing New Tests

### Unit Tests

1. Create a new file in `tests/unit/` with `.test.ts` extension
2. Import the module to test and vitest functions
3. Write describe blocks and test cases
4. Use fixtures from `tests/fixtures/` when needed

### Property Tests

1. Create a new file in `tests/property/` with `.test.ts` extension
2. Import arbitraries from `./arbitraries`
3. Use `fc.assert` and `fc.property` for property-based tests
4. Run at least 100 iterations per property
5. Add a comment referencing the property from design.md:
   ```typescript
   // Feature: wgsl-formatter-vscode-extension, Property X: Description
   ```

## Coverage Goals

- Line coverage: ≥ 90%
- Branch coverage: ≥ 85%
- Function coverage: ≥ 95%
