use crate::location::*;

pub enum Node {
    Document(DocumentNode),
    String(ValueNode<&str>),
    Number(ValueNode<f64>),
    Boolean(ValueNode<bool>),
    Null(ValueNode<None>),
    Array(ArrayNode),
    Object(ObjectNode),
    Member(MemberNode),
    Element(ValueNode<NodeKind>)
}

// let n = ValueNode::<bool>::from_token("true");
    

pub struct ValueNode<T> {
    pub value: T,
    pub loc: LocationRange,
}

pub struct ObjectNode {
    pub members: Vec<MemberNode>,
    pub loc: LocationRange,
}

pub struct MemberNode {
    pub name: ValueNode<&str>,
    pub value: NodeKind,
    pub loc: LocationRange,
}

pub struct ElementNode {
    pub value: NodeKind,
    pub loc: LocationRange,
}

pub struct DocumentNode {
    pub body: NodeKind,
    pub loc: LocationRange,
}
