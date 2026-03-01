/**
 * AST (Abstract Syntax Tree) data models and type definitions for WGSL parser
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
    declarations: (FunctionDecl | StructDecl | VariableDecl | Comment)[];
}

/**
 * Function declaration node
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
 */
export interface StructDecl extends ASTNode {
    type: ASTNodeType.StructDecl;
    name: string;
    fields: VariableDecl[];
}

/**
 * Variable declaration node
 */
export interface VariableDecl extends ASTNode {
    type: ASTNodeType.VariableDecl;
    name: string;
    varType: string;
    initializer: Expression | null;
}

/**
 * Statement node
 */
export interface Statement extends ASTNode {
    type: ASTNodeType.Statement;
    kind: 'return' | 'assignment' | 'expression' | 'block';
    expression?: Expression;
}

/**
 * Expression node
 */
export interface Expression extends ASTNode {
    type: ASTNodeType.Expression;
    kind: 'literal' | 'identifier' | 'binary' | 'unary' | 'call';
    value?: string | number | boolean;
    operator?: string;
    left?: Expression;
    right?: Expression;
    operand?: Expression;
    callee?: string;
    arguments?: Expression[];
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
 */
export interface Attribute extends ASTNode {
    type: ASTNodeType.Attribute;
    name: string;
    arguments: string[];
}
