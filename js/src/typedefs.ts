
//-----------------------------------------------------------------------------
// Options
//-----------------------------------------------------------------------------

/**
 * The mode that Momoa runs in:
 * - "json" for regular JSON
 * - "jsonc" for JSON with C-style comments
 */
export type Mode = "json" | "jsonc";

/**
 * The phase of the traversal step.
 */
export type TraversalPhase = "enter" | "exit";

/**
 * Tokenization options.
 */
export interface TokenizeOptions {

    /**
     * The mode to tokenize in.
     */
    readonly mode: Mode;

    /**
     * When true, includes the `range` key on each token.
     */
    readonly ranges: boolean;
}

/**
 * Parse options.
 */
export interface ParseOptions {

    /**
     * The mode to parse in.
     */
    readonly mode: Mode;

    /**
     * When true, includes the `range` key on each node and token.
     */
    readonly ranges: boolean;

    /**
     * When true, includes the `tokens` key on the document node containing
     * all of the tokens used during parsing.
     */
    readonly tokens: boolean;
}

//-----------------------------------------------------------------------------
// Nodes
//-----------------------------------------------------------------------------

export interface Node {
    type: string;
    loc?: LocationRange;
    range?: Range;
}

/**
 * The root node of a JSON document.
 */
export interface DocumentNode extends Node {
    type: "Document";
    body: ValueNode;
    tokens?: Array<Token>;
}

export interface NullNode extends Node {
    type: "Null";
}

interface LiteralNode<T> extends Node {
    value: T;
}

/**
 * Represents a JSON string.
 */
export interface StringNode extends LiteralNode<string> {
    type: "String";
}

/**
 * Represents a JSON number.
 */
export interface NumberNode extends LiteralNode<number> {
    type: "Number";
}

/**
 * Represents a JSON boolean.
 */
export interface BooleanNode extends LiteralNode<boolean> {
    type: "Boolean";
}

/**
 * Represents an element of a JSON array.
 */
export interface ElementNode extends Node {
    type: "Element";
    value: ValueNode;
}

/**
 * Represents a JSON array.
 */
export interface ArrayNode extends Node {
    type: "Array";
    elements: Array<ElementNode>;
}

/**
 * Represents a member of a JSON object.
 */
export interface MemberNode extends Node {
    type: "Member";
    name: StringNode;
    value: ValueNode;
}

/**
 * Represents a JSON object.
 */
export interface ObjectNode extends Node {
    type: "Object";
    members: Array<MemberNode>;
}

/**
 * Any node that represents a JSON value.
 */
export type ValueNode = ArrayNode | ObjectNode | 
    BooleanNode | StringNode | NumberNode | NullNode;

/**
 * Any node that represents the container for a JSON value.
 */
export type ContainerNode = DocumentNode | MemberNode | ElementNode;

/**
 * Any valid AST node.
 */
export type AnyNode = ValueNode | ContainerNode;

/**
 * Additional information about an AST node.
 */
export interface NodeParts {
    loc?: LocationRange;
    range?: Range;
}

//-----------------------------------------------------------------------------
// Values
//-----------------------------------------------------------------------------

/**
 * Values that can be represented in JSON.
 */
export type JSONValue =
    | Array<JSONValue>
    | boolean
    | number
    | string
    | { [property: string]: JSONValue }
    | null;

//-----------------------------------------------------------------------------
// Tokens
//-----------------------------------------------------------------------------

/**
 * A token used to during JSON parsing.
 */
export interface Token {
    type: TokenType;
    loc: LocationRange;
    range?: Range;
}

/**
 * The type of token.
 */
export type TokenType = "Number" | "String" | "Boolean" | "Colon" | "LBrace" |
    "RBrace" | "RBracket" | "LBracket" | "Comma" | "Null" | "LineComment" |
    "BlockComment";

//-----------------------------------------------------------------------------
// Location Related
//-----------------------------------------------------------------------------

/**
 * The start and stop location for a token or node inside the source text.
 */
export interface LocationRange {
    start: Location;
    end: Location;
}

/**
 * A cursor location inside the source text.
 */
export interface Location {
    line: number;
    column: number;
    offset: number;
}

/**
 * The start and stop offset for a given node or token inside the source text.
 */
export type Range = number[];
