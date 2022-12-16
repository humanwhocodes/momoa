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
