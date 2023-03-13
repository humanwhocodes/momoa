
//-----------------------------------------------------------------------------
// Options
//-----------------------------------------------------------------------------

type Mode = "json" | "jsonc";

interface TokenizeOptions {
    readonly mode: Mode;
    readonly ranges: boolean;
}

interface ParseOptions {
    readonly mode: Mode;
    readonly ranges: boolean;
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
    body: Node;
}

export interface NullNode extends Node {
    type: "Null";
}

interface ValueNode<T> extends Node {
    value: T;
}

export interface StringNode extends ValueNode<string> {
    type: "String";
}

export interface NumberNode extends ValueNode<number> {
    type: "Number";
}

export interface BooleanNode extends ValueNode<boolean> {
    type: "Boolean";
}

/**
 * An array element.
 */
export interface ElementNode extends Node {
    value: Node;
}

/**
 * An array.
 */
export interface ArrayNode extends Node {
    elements: Array<ElementNode>;
}

/**
 * An object member.
 */
export interface MemberNode extends Node {
    name: StringNode;
    value: Node;
}

/**
 * An object.
 */
export interface ObjectNode extends Node {
    members: Array<MemberNode>;
}

type AnyNode = DocumentNode | ArrayNode | BooleanNode |
    ElementNode | MemberNode | BooleanNode | StringNode |
    NumberNode | Node;

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
