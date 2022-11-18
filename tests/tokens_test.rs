
use momoa::{tokenize, TokenKind, Location};
use test_case::test_case;

#[test_case("false", TokenKind::False ; "tokenize_false")]
#[test_case("true", TokenKind::True ; "tokenize_true")]
#[test_case("null", TokenKind::Null ; "tokenize_null")]
fn should_tokenize_keywords(code: &str, kind: TokenKind) {
    let result = tokenize(code).unwrap();
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
    let result = tokenize(code).unwrap();
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
    tokenize("-").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_input_reading_float() {
    tokenize("5.").unwrap();
}

    //Invalid: "01", "-e", ".1", "5e", "1E+", "25e-"
#[test]
#[should_panic(expected="Unexpected character '1' found.")]
fn should_panic_unexpected_start_of_number() {
    tokenize("01").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'e' found.")]
fn should_panic_unexpected_e() {
    tokenize("-e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '.' found.")]
fn should_panic_unexpected_start_with_dot() {
    tokenize(".1").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_after_e() {
    tokenize("25e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_plus_after_e() {
    tokenize("3E+").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_minus_after_e() {
    tokenize("33e-").unwrap();
}

#[test_case("\"hello\"" ; "simple")]
#[test_case("\"hello\\u32AF\"" ; "unicode_escape")]
#[test_case("\"\\n\\r\\t\\f\\\"\\b\"" ; "normal_escapes")]
fn should_tokenize_strings(code: &str) {
    let result = tokenize(code).unwrap();
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
    tokenize("\"hello\\u32AX\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '\"' found.")]
fn should_panic_premature_unicode_escape_end() {
    tokenize("\"hello\\u32A\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unicode_escape_end_of_input() {
    tokenize("\"hello\\u32A").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_string() {
    tokenize("\"hello").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'x' found.")]
fn should_panic_invalid_escape() {
    tokenize("\"\\x\"").unwrap();
}
