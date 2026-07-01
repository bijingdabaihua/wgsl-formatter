/**
 * AST (Abstract Syntax Tree) data models and type definitions for WGSL parser
 *
 * Spec Reference: SPEC.md
 * Covers: All WGSL constructs defined in the formatting specification
 */

/**
 * Position information in source code
 */
export interface Position {
    line: number;      // 1-based line number
    column: number;    // 0-based column number
    offset: number;    // 0-based character offset from start of file
}

/**
 * AST node types
 */
export enum ASTNodeType {
    Program = 'Program',
    FunctionDecl = 'FunctionDecl',
    StructDecl = 'StructDecl',
    VariableDecl = 'VariableDecl',
    Statement = 'Statement',
    Expression = 'Expression',
    Comment = 'Comment',
    Attribute = 'Attribute',
    EnableDirective = 'EnableDirective',
    DiagnosticDirective = 'DiagnosticDirective',
    AliasDecl = 'AliasDecl',
    OverrideDecl = 'OverrideDecl',
    IfStmt = 'IfStmt',
    ForStmt = 'ForStmt',
    WhileStmt = 'WhileStmt',
    SwitchStmt = 'SwitchStmt',
    CaseStmt = 'CaseStmt',
    BreakStmt = 'BreakStmt',
    ContinueStmt = 'ContinueStmt',
    LoopStmt = 'LoopStmt',
}

/**
 * Base AST node interface
 */
export interface ASTNode {
    type: ASTNodeType;
    start: Position;
    end: Position;
    children: ASTNode[];
}

/**
 * Program node - root of the AST
 */
export interface Program extends ASTNode {
    type: ASTNodeType.Program;
    declarations: TopLevelDecl[];
}

export type TopLevelDecl =
    | FunctionDecl
    | StructDecl
    | VariableDecl
    | EnableDirective
    | DiagnosticDirective
    | AliasDecl
    | OverrideDecl
    | Comment;

/**
 * Function declaration node
 * Spec: §8.1
 */
export interface FunctionDecl extends ASTNode {
    type: ASTNodeType.FunctionDecl;
    name: string;
    parameters: VariableDecl[];
    returnType: string | null;
    attributes: Attribute[];
    body: Statement[];
}

/**
 * Struct declaration node
 * Spec: §8.2
 */
export interface StructDecl extends ASTNode {
    type: ASTNodeType.StructDecl;
    name: string;
    fields: StructField[];
}

/**
 * Struct field
 * Spec: §8.2 - includes per-field attributes like @location(0)
 */
export interface StructField extends ASTNode {
    type: ASTNodeType.VariableDecl;
    name: string;
    varType: string;
    attributes: Attribute[];
}

/**
 * Variable declaration node
 * Spec: §8.3
 */
export interface VariableDecl extends ASTNode {
    type: ASTNodeType.VariableDecl;
    name: string;
    varType: string;
    keyword?: string;       // 'var', 'let', or 'const'
    storageClass?: string;  // <uniform>, <storage>, <function>, <private>, <workgroup>
    initializer: Expression | null;
    attributes: Attribute[];
}

/**
 * Enable directive
 * Spec: §8.5 - `enable f16;`
 */
export interface EnableDirective extends ASTNode {
    type: ASTNodeType.EnableDirective;
    feature: string;
}

/**
 * Diagnostic directive
 * Spec: §8.6 - `diagnostic(off, derivative_uniformity);`
 */
export interface DiagnosticDirective extends ASTNode {
    type: ASTNodeType.DiagnosticDirective;
    severity: string;       // off, warning, error
    ruleName: string;       // e.g. derivative_uniformity
}

/**
 * Type alias declaration
 * Spec: §8.7 - `alias Float4 = vec4<f32>;`
 */
export interface AliasDecl extends ASTNode {
    type: ASTNodeType.AliasDecl;
    name: string;
    targetType: string;
}

/**
 * Override declaration
 * Spec: §8.3 - `override maxLights: u32 = 4;`
 */
export interface OverrideDecl extends ASTNode {
    type: ASTNodeType.OverrideDecl;
    name: string;
    varType: string;
    initializer: Expression | null;
}

/**
 * Statement node
 */
export interface Statement extends ASTNode {
    type: ASTNodeType.Statement;
    kind: 'return' | 'assignment' | 'expression' | 'block' | 'variableDecl';
    expression?: Expression;
    varDecl?: VariableDecl;
}

/**
 * If/Else statement
 * Spec: §8.4
 */
export interface IfStmt extends ASTNode {
    type: ASTNodeType.IfStmt;
    condition: Expression;
    thenBody: Statement[];
    elseBody: (IfStmt | Statement[]) | null;
}

/**
 * For statement
 * Spec: §8.4
 */
export interface ForStmt extends ASTNode {
    type: ASTNodeType.ForStmt;
    initializer: Statement | null;
    condition: Expression | null;
    increment: Expression | null;
    body: Statement[];
}

/**
 * While statement
 * Spec: §8.4
 */
export interface WhileStmt extends ASTNode {
    type: ASTNodeType.WhileStmt;
    condition: Expression;
    body: Statement[];
}

/**
 * Loop statement
 * WGSL specific: `loop { ... }`
 */
export interface LoopStmt extends ASTNode {
    type: ASTNodeType.LoopStmt;
    body: Statement[];
}

/**
 * Switch statement
 * Spec: §8.4
 */
export interface SwitchStmt extends ASTNode {
    type: ASTNodeType.SwitchStmt;
    condition: Expression;
    cases: CaseStmt[];
}

/**
 * Case clause in switch
 * Spec: §8.4
 */
export interface CaseStmt extends ASTNode {
    type: ASTNodeType.CaseStmt;
    selectors: (number | string)[]; // empty for default
    body: Statement[];
}

/**
 * Break statement
 */
export interface BreakStmt extends ASTNode {
    type: ASTNodeType.BreakStmt;
}

/**
 * Continue statement
 */
export interface ContinueStmt extends ASTNode {
    type: ASTNodeType.ContinueStmt;
}

/**
 * Expression node - full expression tree
 * Spec: §10.3 - full operator precedence
 */
export interface Expression extends ASTNode {
    type: ASTNodeType.Expression;
    kind:
        | 'literal'
        | 'identifier'
        | 'binary'
        | 'unary'
        | 'call'
        | 'memberAccess'    // a.b
        | 'indexAccess'     // a[i]
        | 'bitwiseNot'      // ~
        | 'cast';
    value?: string | number | boolean;
    operator?: string;
    left?: Expression;
    right?: Expression;
    operand?: Expression;
    callee?: string;
    arguments?: Expression[];
    object?: Expression;    // for memberAccess: the lhs
    member?: string;        // for memberAccess: the property name
    index?: Expression;     // for indexAccess: the index expression
    castType?: string;      // for type casts
}

/**
 * Comment node
 */
export interface Comment extends ASTNode {
    type: ASTNodeType.Comment;
    text: string;
    isBlockComment: boolean;
}

/**
 * Attribute node (e.g., @vertex, @fragment, @binding(0))
 * Spec: §9 - attribute formatting
 */
export interface Attribute extends ASTNode {
    type: ASTNodeType.Attribute;
    name: string;
    arguments: string[];
}
