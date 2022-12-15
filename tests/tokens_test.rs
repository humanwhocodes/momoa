use momoa::{tokenize_json, tokenize_jsonc, TokenKind, Location};
use test_case::test_case;

#[test_case("false", TokenKind::Boolean ; "tokenize_false")]
#[test_case("true", TokenKind::Boolean ; "tokenize_true")]
#[test_case("null", TokenKind::Null ; "tokenize_null")]
fn should_tokenize_keywords(code: &str, kind: TokenKind) {
    let result = tokenize_json(code).unwrap();
    assert_eq!(result[0].kind, kind);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len() + 1,
        offset: code.len()
    });
}

#[test_case("43e2" ; "tokenize_e_number")]
#[test_case("41.3e+2" ; "tokenize_e_plus_number")]
#[test_case("238e-2" ; "tokenize_e_minus_number")]
#[test_case("250" ; "tokenize_integer")]
#[test_case("-123" ; "tokenize_negative_integer")]
#[test_case("0.1" ; "tokenize_float")]
#[test_case("-23.12" ; "tokenize_negative_float")]
#[test_case("0" ; "tokenize_zero")]
#[test_case("1" ; "tokenize_single_digit")]
#[test_case("-1345.98324978324780943" ; "tokenize_negative_long_float")]
fn should_tokenize_numbers(code: &str) {
    let result = tokenize_json(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::Number);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len() + 1,
        offset: code.len()
    });
}


#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_input_reading_minus() {
    tokenize_json("-").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_input_reading_float() {
    tokenize_json("5.").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '1' found.")]
fn should_panic_unexpected_start_of_number() {
    tokenize_json("01").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'e' found.")]
fn should_panic_unexpected_e() {
    tokenize_json("-e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '.' found.")]
fn should_panic_unexpected_start_with_dot() {
    tokenize_json(".1").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_after_e() {
    tokenize_json("25e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_plus_after_e() {
    tokenize_json("3E+").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_minus_after_e() {
    tokenize_json("33e-").unwrap();
}

#[test_case("\"hello\"" ; "simple")]
#[test_case("\"hello\\u32AF\"" ; "unicode_escape")]
#[test_case("\"\\n\\r\\t\\f\\\"\\b\"" ; "normal_escapes")]
fn should_tokenize_strings(code: &str) {
    let result = tokenize_json(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::String);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len() + 1,
        offset: code.len()
    });
}

#[test]
#[should_panic(expected="Unexpected character 'X' found.")]
fn should_panic_unexpected_unicode_escape_character() {
    tokenize_json("\"hello\\u32AX\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '\"' found.")]
fn should_panic_premature_unicode_escape_end() {
    tokenize_json("\"hello\\u32A\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unicode_escape_end_of_input() {
    tokenize_json("\"hello\\u32A").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_string() {
    tokenize_json("\"hello").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'x' found.")]
fn should_panic_invalid_escape() {
    tokenize_json("\"\\x\"").unwrap();
}

#[test]
fn should_tokenize_line_comment_without_eol() {
    let code = "// foo";
    let result = tokenize_jsonc(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::LineComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len() + 1,
        offset: code.len()
    });
}

#[test]
fn should_tokenize_line_comment_with_eol() {
    let code = "// foo\n";
    let result = tokenize_jsonc(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::LineComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len() + 1,
        offset: code.len()
    });
}