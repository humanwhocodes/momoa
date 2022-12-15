use crate::location::*;
use crate::tokens::Token;
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum Node {
    Document(Box<DocumentNode>),
    String(Box<ValueNode<&'static str>>),
    Number(Box<ValueNode<f64>>),
    Boolean(Box<ValueNode<bool>>),
    Null(Box<NullNode>),
    Array(Box<ArrayNode>),
    Object(Box<ObjectNode>),
    Member(Box<MemberNode>),
    Element(Box<ValueNode<Node>>)
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ValueNode<T> {
    pub value: T,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ObjectNode {
    pub members: Vec<MemberNode>,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ArrayNode {
    pub elements: Vec<MemberNode>,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct MemberNode {
    pub name: ValueNode<&'static str>,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ElementNode {
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct NullNode {
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct DocumentNode {
    pub body: Node,
    pub loc: LocationRange,
    pub tokens: Vec<Token>
}
