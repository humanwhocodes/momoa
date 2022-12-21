use momoa::{LocationRange, Location};
use momoa::ast::*;
use test_case::test_case;
use momoa::json;
use momoa::jsonc;

#[test_case("false"; "parse_true")]
#[test_case("true"; "parse_false")]
fn should_parse_boolean(code: &str) {
    let ast = json::parse(code).unwrap();
    let expected_value = code == "true";
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: code.len() + 1,
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Boolean(body) => {
                    assert_eq!(body.loc, expected_location);
                    assert_eq!(body.value, expected_value);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test]
#[should_panic(expected="Unexpected character Some('y') found.")]
fn should_panic_unexpected_boolean() {
    json::parse("try").unwrap();
}

#[test_case("43e2" ; "parse_e_number")]
#[test_case("41.3e+2" ; "parse_e_plus_number")]
#[test_case("238e-2" ; "parse_e_minus_number")]
#[test_case("250" ; "parse_integer")]
#[test_case("-123" ; "parse_negative_integer")]
#[test_case("0.1" ; "parse_float")]
#[test_case("-23.12" ; "parse_negative_float")]
#[test_case("0" ; "parse_zero")]
#[test_case("1" ; "parse_single_digit")]
#[test_case("-1345.98324978324780943" ; "parse_negative_long_float")]
fn should_parse_number(code: &str) {
    let ast = json::parse(code).unwrap();
    let expected_value = code.parse::<f64>().unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: code.len() + 1,
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Number(body) => {
                    assert_eq!(body.loc, expected_location);
                    assert_eq!(body.value, expected_value);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}


#[test]
fn should_parse_null() {
    let code = "null";
    let ast = json::parse(code).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: code.len() + 1,
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Null(body) => {
                    assert_eq!(body.loc, expected_location);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test_case(r#""abc""#, "abc" ; "regular_string")]
#[test_case(r#""ab\ncd""#, "ab\ncd" ; "newline")]
#[test_case(r#""ab\\cd""#, "ab\\cd" ; "slash")]
#[test_case(r#""ab\/cd""#, "ab/cd" ; "forward_slash")]
#[test_case(r#""ab\r\ncd""#, "ab\r\ncd" ; "windows_newline")]
#[test_case(r#""ab\"cd""#, "ab\"cd" ; "double_quote")]
#[test_case(r#""ab\tcd""#, "ab\tcd" ; "tab")]
#[test_case(r#""ab\bcd""#, "ab\u{0008}cd" ; "backspace")]
#[test_case(r#""ab\fcd""#, "ab\u{000c}cd" ; "formfeed")]
#[test_case(r#""ab\u0013cd""#, "ab\u{0013}cd" ; "unicode_escape")]
#[test_case(r#""ab\uaf01cd""#, "ab\u{af01}cd" ; "unicode_escape_2")]
fn should_parse_string(code: &str, expected_value: &str) {
    let ast = json::parse(code).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: code.len() + 1,
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::String(body) => {
                    assert_eq!(body.loc, expected_location);
                    assert_eq!(body.value, expected_value);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test]
#[should_panic(expected="Unexpected character '/' found.")]
fn should_panic_line_comment() {
    json::parse("// foo").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '/' found.")]
fn should_panic_block_comment() {
    json::parse("/* foo */").unwrap();
}

#[test]
fn should_parse_empty_array() {
    let code = "[]";
    let ast = json::parse(code).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: 3,
            offset: 2
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Array(body) => {
                    assert_eq!(body.elements.len(), 0);
                    assert_eq!(body.loc, expected_location);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test_case("true" ; "boolean")]
#[test_case("12" ; "number")]
#[test_case("null" ; "null")]
#[test_case("\"foo\"" ; "string")]
fn should_parse_one_element_array(element: &str) {
    let mut code = String::new();
    code.push('[');
    code.push_str(element);
    code.push(']');

    let ast = json::parse(code.as_str()).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: 1 + code.len(),
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Array(body) => {
                    assert_eq!(body.elements.len(), 1);
                    assert_eq!(body.loc, expected_location);
                    // assert_eq!(body.elements[0], Node)
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test]
#[should_panic(expected="Unexpected character ',' found.")]
fn should_panic_extra_array_comma() {
    json::parse("[,]").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character ']' found.")]
fn should_panic_extra_array_comma_after_number() {
    json::parse("[34,]").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character ']' found.")]
fn should_panic_extra_array_comma_after_boolean() {
    json::parse("[true,]").unwrap();
}

#[test]
fn should_parse_empty_object() {
    let code = "{}";
    let ast = json::parse(code).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: 3,
            offset: 2
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Object(body) => {
                    assert_eq!(body.members.len(), 0);
                    assert_eq!(body.loc, expected_location);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test_case("true" ; "boolean")]
#[test_case("12" ; "number")]
#[test_case("null" ; "null")]
#[test_case("\"foo\"" ; "string")]
fn should_parse_one_member_object(element: &str) {
    let mut code = String::new();
    code.push_str("{\"foo\":");
    code.push_str(element);
    code.push('}');

    let ast = json::parse(code.as_str()).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 1,
            offset: 0
        },
        end: Location {
            line: 1,
            column: 1 + code.len(),
            offset: code.len()
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Object(body) => {
                    assert_eq!(body.members.len(), 1);
                    assert_eq!(body.loc, expected_location);
                    // assert_eq!(body.elements[0], Node)
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}

#[test]
#[should_panic(expected="Unexpected character ',' found.")]
fn should_panic_extra_object_comma() {
    json::parse("{,}").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '}' found.")]
fn should_panic_extra_object_comma_after_number() {
    json::parse("{\"a\":1,}").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '}' found.")]
fn should_panic_extra_object_comma_after_boolean() {
    json::parse("{\"a\":true,}").unwrap();
}

//-----------------------------------------------------------------------------
// JSONC Tests
//-----------------------------------------------------------------------------

#[test]
fn should_parse_null_json_c() {
    let code = "/* foo */null/* bar */";
    let ast = jsonc::parse(code).unwrap();
    let expected_location = LocationRange {
        start: Location {
            line: 1,
            column: 10,
            offset: 9
        },
        end: Location {
            line: 1,
            column: 14,
            offset: 13
        }
    };

    match ast {
        Node::Document(doc) => {
            
            assert_eq!(doc.loc, expected_location);

            match doc.body {
                Node::Null(body) => {
                    assert_eq!(body.loc, expected_location);
                },
                _ => panic!("Invalid node returned as body.")
            }
        },
        _ => panic!("Invalid node returned from parse().")
    }
}
