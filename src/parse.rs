use crate::location::*;
use crate::ast::*;
use crate::tokens::*;

struct ParseContext {
    tokens: Tokens,
    text: &str,
    current: Option<&Token>
}

pub fn parse(text: &str) -> Node::Document {
    let tokens = Tokens::new(text);


}


fn parse_boolean(context: &ParseContext) -> Node::Boolean {
    Node::Boolean(ValueNode {
        value: context.get_current_text() == "true",
        loc: context.current.loc
    })
}

fn parse_number(context: &ParseContext) -> Node::Number {
    Node::Boolean(ValueNode {
        value: f64::parse(context.get_current_text()),
        loc: context.current.loc
    })
}

fn parse_string(context: &ParseContext) -> Node::String {
    let token = context.current;

    Node::String(StringNode {
        value: context.text[token.loc.start.offset..token.loc.end.offset],
        loc: context.current.loc
    })
}

#[cfg(test)]
mod tests {

    fn test_parse_number() {
        let result = parse_number(ParserContext)
    }

}
