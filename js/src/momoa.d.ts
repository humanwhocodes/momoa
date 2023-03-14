
//-----------------------------------------------------------------------------
// Options
//-----------------------------------------------------------------------------

export type Mode = "json" | "jsonc";

export interface TokenizeOptions {
    readonly mode: Mode;
    readonly ranges: boolean;
}

export interface ParseOptions {
    readonly mode: Mode;
    readonly ranges: boolean;
    readonly tokens: boolean;
}

//-----------------------------------------------------------------------------
// Nodes
//-----------------------------------------------------------------------------

interface Node {
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
}

export interface NullNode extends Node {
    type: "Null";
}

interface LiteralNode<T> extends Node {
    value: T;
}

export interface StringNode extends LiteralNode<string> {
    type: "String";
}

export interface NumberNode extends LiteralNode<number> {
    type: "Number";
}

export interface BooleanNode extends LiteralNode<boolean> {
    type: "Boolean";
}

/**
 * An array element.
 */
export interface ElementNode extends Node {
    type: "Element";
    value: ValueNode;
}

/**
 * An array.
 */
export interface ArrayNode extends Node {
    type: "Array";
    elements: Array<ElementNode>;
}

/**
 * An object member.
 */
export interface MemberNode extends Node {
    type: "Member";
    name: StringNode;
    value: ValueNode;
}

/**
 * An object.
 */
export interface ObjectNode extends Node {
    type: "Object";
    members: Array<MemberNode>;
}

type ValueNode = ArrayNode | ObjectNode | 
    BooleanNode | StringNode | NumberNode | NullNode;

type ContainerNode = DocumentNode | MemberNode | ElementNode;

type AnyNode = ValueNode | ContainerNode;
/**
 * Additional information about the node.
 */
export interface NodeParts {
    loc?: LocationRange;
    range?: Range;
}

//-----------------------------------------------------------------------------
// Values
//-----------------------------------------------------------------------------

type JSONValue =
    | Array<JSONValue>
    | boolean
    | number
    | string
    | { [property: string]: JSONValue }
    | null;

//-----------------------------------------------------------------------------
// Tokens
//-----------------------------------------------------------------------------

export interface Token {
    type: TokenType;
    loc: LocationRange;
    range?: Range;
}

export type TokenType = "Number" | "String" | "Boolean" | "Colon" | "LBrace" |
    "RBrace" | "RBracket" | "LBracket" | "Comma" | "Null" | "LineComment" |
    "BlockComment";

//-----------------------------------------------------------------------------
// Location Related
//-----------------------------------------------------------------------------

export interface LocationRange {
    start: Location;
    end: Location;
}

export interface Location {
    line: number;
    column: number;
    offset: number;
}

export type Range = number[];
