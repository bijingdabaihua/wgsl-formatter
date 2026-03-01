/**
 * WGSL Code Generators (Arbitraries) for Property-Based Testing
 * 
 * This module provides fast-check arbitraries for generating valid WGSL code
 * to support property-based testing of the formatter.
 */

import fc from 'fast-check';

// WGSL keywords that should not be used as identifiers
const WGSL_KEYWORDS = new Set([
    'fn', 'var', 'let', 'const', 'struct', 'if', 'else', 'for', 'while', 'loop',
    'break', 'continue', 'return', 'discard', 'switch', 'case', 'default',
    'true', 'false', 'array', 'override', 'private', 'workgroup', 'uniform',
    'storage', 'function', 'read', 'write', 'read_write',
]);

/**
 * Generate valid WGSL identifiers
 * Must start with letter or underscore, followed by alphanumeric or underscore
 */
export const identifierArbitrary = (): fc.Arbitrary<string> =>
    fc.string({ minLength: 1, maxLength: 20 })
        .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
        .filter(s => !WGSL_KEYWORDS.has(s));

/**
 * Generate WGSL scalar types
 */
const scalarTypeArbitrary = (): fc.Arbitrary<string> =>
    fc.constantFrom('f32', 'i32', 'u32', 'bool');

/**
 * Generate WGSL vector types
 */
const vectorTypeArbitrary = (): fc.Arbitrary<string> =>
    fc.tuple(scalarTypeArbitrary(), fc.constantFrom(2, 3, 4))
        .map(([scalarType, size]) => `vec${size}<${scalarType}>`);

/**
 * Generate WGSL matrix types
 */
const matrixTypeArbitrary = (): fc.Arbitrary<string> =>
    fc.tuple(
        fc.constantFrom('f32'),
        fc.constantFrom(2, 3, 4),
        fc.constantFrom(2, 3, 4)
    ).map(([scalarType, cols, rows]) => `mat${cols}x${rows}<${scalarType}>`);

/**
 * Generate any WGSL type
 */
export const typeArbitrary = (): fc.Arbitrary<string> =>
    fc.oneof(
        scalarTypeArbitrary(),
        vectorTypeArbitrary(),
        matrixTypeArbitrary()
    );

/**
 * Generate WGSL literal values
 */
export const literalArbitrary = (type?: string): fc.Arbitrary<string> => {
    if (!type) {
        return fc.oneof(
            fc.float().map(n => `${n}`),
            fc.integer().map(n => `${n}`),
            fc.constantFrom('true', 'false')
        );
    }

    if (type === 'f32') {
        return fc.float().map(n => `${n}`);
    } else if (type === 'i32' || type === 'u32') {
        return fc.integer().map(n => `${n}`);
    } else if (type === 'bool') {
        return fc.constantFrom('true', 'false');
    } else if (type.startsWith('vec')) {
        const match = type.match(/vec(\d)<(.+)>/);
        if (match) {
            const size = parseInt(match[1]);
            const scalarType = match[2];
            return fc.array(literalArbitrary(scalarType), { minLength: size, maxLength: size })
                .map(values => `${type}(${values.join(', ')})`);
        }
    }

    return fc.constant('0.0');
};

/**
 * Generate WGSL variable declarations
 */
export const variableDeclArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        varType: typeArbitrary(),
        hasInitializer: fc.boolean(),
    }).chain(({ name, varType, hasInitializer }) => {
        if (hasInitializer) {
            return literalArbitrary(varType).map(value =>
                `var ${name}: ${varType} = ${value};`
            );
        }
        return fc.constant(`var ${name}: ${varType};`);
    });

/**
 * Generate WGSL let declarations (constants)
 */
export const letDeclArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        varType: typeArbitrary(),
    }).chain(({ name, varType }) =>
        literalArbitrary(varType).map(value =>
            `let ${name}: ${varType} = ${value};`
        )
    );

/**
 * Generate WGSL function parameters
 */
const parameterArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        paramType: typeArbitrary(),
    }).map(({ name, paramType }) => `${name}: ${paramType}`);

/**
 * Generate WGSL return statements
 */
const returnStatementArbitrary = (returnType?: string): fc.Arbitrary<string> => {
    if (!returnType) {
        return fc.constant('return;');
    }
    return literalArbitrary(returnType).map(value => `return ${value};`);
};

/**
 * Generate simple WGSL statements
 */
const simpleStatementArbitrary = (): fc.Arbitrary<string> =>
    fc.oneof(
        variableDeclArbitrary(),
        letDeclArbitrary(),
        fc.constant('return;')
    );

/**
 * Generate WGSL function declarations
 */
export const functionDeclArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        params: fc.array(parameterArbitrary(), { maxLength: 5 }),
        hasReturnType: fc.boolean(),
        returnType: typeArbitrary(),
        bodySize: fc.integer({ min: 0, max: 5 }),
    }).chain(({ name, params, hasReturnType, returnType, bodySize }) => {
        const paramStr = params.join(', ');
        const returnTypeStr = hasReturnType ? ` -> ${returnType}` : '';

        return fc.array(simpleStatementArbitrary(), { minLength: bodySize, maxLength: bodySize })
            .chain(statements => {
                const finalReturnType = hasReturnType ? returnType : undefined;
                return returnStatementArbitrary(finalReturnType).map(returnStmt => {
                    const allStatements = [...statements, returnStmt];
                    const bodyStr = allStatements.map(s => `    ${s}`).join('\n');
                    return `fn ${name}(${paramStr})${returnTypeStr} {\n${bodyStr}\n}`;
                });
            });
    });

/**
 * Generate WGSL struct field declarations
 */
const structFieldArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        fieldType: typeArbitrary(),
    }).map(({ name, fieldType }) => `    ${name}: ${fieldType},`);

/**
 * Generate WGSL struct declarations
 */
export const structDeclArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        fields: fc.array(structFieldArbitrary(), { minLength: 1, maxLength: 8 }),
    }).map(({ name, fields }) => {
        const fieldsStr = fields.join('\n');
        return `struct ${name} {\n${fieldsStr}\n}`;
    });

/**
 * Generate WGSL line comments
 */
const lineCommentArbitrary = (): fc.Arbitrary<string> =>
    fc.string({ minLength: 0, maxLength: 50 })
        .filter(s => !s.includes('\n'))
        .map(text => `// ${text}`);

/**
 * Generate WGSL block comments
 */
const blockCommentArbitrary = (): fc.Arbitrary<string> =>
    fc.array(fc.string({ minLength: 0, maxLength: 40 }), { minLength: 1, maxLength: 3 })
        .map(lines => `/* ${lines.join('\n   ')} */`);

/**
 * Generate WGSL comments
 */
export const commentArbitrary = (): fc.Arbitrary<string> =>
    fc.oneof(
        lineCommentArbitrary(),
        blockCommentArbitrary()
    );

/**
 * Generate top-level WGSL declarations
 */
const topLevelDeclArbitrary = (): fc.Arbitrary<string> =>
    fc.oneof(
        functionDeclArbitrary(),
        structDeclArbitrary(),
        variableDeclArbitrary(),
        commentArbitrary()
    );

/**
 * Generate complete WGSL code with multiple declarations
 */
export const wgslCodeArbitrary = (): fc.Arbitrary<string> =>
    fc.array(topLevelDeclArbitrary(), { minLength: 1, maxLength: 10 })
        .map(decls => decls.join('\n\n'));

/**
 * Generate WGSL code with specific characteristics for testing
 */
export const wgslCodeWithCharacteristics = (options: {
    minLines?: number;
    maxLines?: number;
    includeComments?: boolean;
    includeStructs?: boolean;
    includeFunctions?: boolean;
}): fc.Arbitrary<string> => {
    const {
        minLines = 1,
        maxLines = 20,
        includeComments = true,
        includeStructs = true,
        includeFunctions = true,
    } = options;

    const generators: fc.Arbitrary<string>[] = [];

    if (includeFunctions) {
        generators.push(functionDeclArbitrary());
    }
    if (includeStructs) {
        generators.push(structDeclArbitrary());
    }
    if (includeComments) {
        generators.push(commentArbitrary());
    }

    if (generators.length === 0) {
        generators.push(variableDeclArbitrary());
    }

    return fc.array(fc.oneof(...generators), { minLength: minLines, maxLength: maxLines })
        .map(decls => decls.join('\n\n'));
};

/**
 * Generate WGSL expressions for testing
 */
export const expressionArbitrary = (): fc.Arbitrary<string> =>
    fc.oneof(
        literalArbitrary(),
        identifierArbitrary(),
        fc.tuple(literalArbitrary(), fc.constantFrom('+', '-', '*', '/'), literalArbitrary())
            .map(([left, op, right]) => `${left} ${op} ${right}`)
    );

/**
 * Generate long WGSL expressions for line wrapping tests
 */
export const longExpressionArbitrary = (): fc.Arbitrary<string> =>
    fc.array(literalArbitrary(), { minLength: 5, maxLength: 10 })
        .chain(values =>
            fc.array(fc.constantFrom('+', '-', '*', '/'), { minLength: values.length - 1, maxLength: values.length - 1 })
                .map(operators => {
                    let expr = values[0];
                    for (let i = 0; i < operators.length; i++) {
                        expr += ` ${operators[i]} ${values[i + 1]}`;
                    }
                    return expr;
                })
        );

/**
 * Generate WGSL code with specific formatting issues for testing
 */
export const unformattedWgslArbitrary = (): fc.Arbitrary<string> =>
    fc.record({
        name: identifierArbitrary(),
        params: fc.array(parameterArbitrary(), { maxLength: 3 }),
    }).map(({ name, params }) => {
        // Generate intentionally poorly formatted code
        const paramStr = params.join(','); // No spaces after commas
        return `fn ${name}(${paramStr}){return;}`;
    });
