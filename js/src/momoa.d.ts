
//-----------------------------------------------------------------------------
// Options
//-----------------------------------------------------------------------------

type MomoaMode = "json" | "jsonc";

interface MomoaTokenizeOptions {
    mode: MomoaMode;
    ranges: boolean;
}

interface MomoaParseOptions {
    mode: MomoaMode;
    ranges: boolean;
    tokens: boolean;
}

//-----------------------------------------------------------------------------
// Nodes
//-----------------------------------------------------------------------------

export interface MomoaNode {
    type: string;
    loc?: MomoaLocationRange;
    range?: MomoaRange;
}

/**
 * The root node of a JSON document.
 */
export interface MomoaDocumentNode extends MomoaNode {
    body: MomoaNode;
}

/**
 * Strings, numbers, and booleans.
 */
interface MomoaValueNode<T> extends MomoaNode {
    value: T;
}

export type MomoaStringNode = MomoaValueNode<string>;
export type MomoaNumberNode = MomoaValueNode<number>;
export type MomoaBooleanNode = MomoaValueNode<boolean>;

/**
 * An array element.
 */
export interface MomoaElementNode extends MomoaNode {
    value: MomoaNode;
}

/**
 * An array.
 */
export interface MomoaArrayNode extends MomoaNode {
    elements: Array<MomoaElementNode>;
}

/**
 * An object member.
 */
export interface MomoaMemberNode extends MomoaNode {
    name: MomoaStringNode;
    value: MomoaNode;
}

/**
 * An object.
 */
export interface MomoaObjectNode extends MomoaNode {
    members: Array<MomoaMemberNode>;
}

type MomoaAnyNode = MomoaDocumentNode | MomoaArrayNode | MomoaBooleanNode |
    MomoaElementNode | MomoaMemberNode | MomoaBooleanNode | MomoaStringNode |
    MomoaNumberNode | MomoaNode;

/**
 * Additional information about the node.
 */
export interface MomoaNodeParts {
    loc?: MomoaLocationRange;
    range?: MomoaRange;
}

//-----------------------------------------------------------------------------
// Tokens
//-----------------------------------------------------------------------------

export interface MomoaToken {
    type: string;
    loc: MomoaLocationRange;
    range?: MomoaRange;
}

//-----------------------------------------------------------------------------
// Location Related
//-----------------------------------------------------------------------------

export interface MomoaLocationRange {
    start: MomoaLocation;
    end: MomoaLocation;
}

export interface MomoaLocation {
    line: number;
    column: number;
    offset: number;
}

export type MomoaRange = Array<number>;
