use crate::location::*;
use crate::tokens::Token;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Node {
    Document(Box<DocumentNode>),
    String(Box<ValueNode<String>>),
    Number(Box<ValueNode<f64>>),
    Boolean(Box<ValueNode<bool>>),
    Null(Box<NullNode>),
    Array(Box<ArrayNode>),
    Object(Box<ObjectNode>),
    Member(Box<MemberNode>),
    Element(Box<ValueNode<Node>>),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ValueNode<T> {
    pub value: T,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ObjectNode {
    pub members: Vec<Node>,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ArrayNode {
    pub elements: Vec<Node>,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MemberNode {
    pub name: Node,
    pub value: Node,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ElementNode {
    pub value: Node,
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct NullNode {
    pub loc: LocationRange,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DocumentNode {
    pub body: Node,
    pub loc: LocationRange,
    pub tokens: Vec<Token>,
}
