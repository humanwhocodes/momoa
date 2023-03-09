use momoa::*;
use test_case::test_case;

#[test_case("false", TokenKind::Boolean ; "tokenize_false")]
#[test_case("true", TokenKind::Boolean ; "tokenize_true")]
#[test_case("null", TokenKind::Null ; "tokenize_null")]
fn should_tokenize_keywords(code: &str, kind: TokenKind) {
    let result = json::tokenize(code).unwrap();
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
    let result = json::tokenize(code).unwrap();
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
    json::tokenize("-").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_input_reading_float() {
    json::tokenize("5.").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '1' found.")]
fn should_panic_unexpected_start_of_number() {
    json::tokenize("01").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'e' found.")]
fn should_panic_unexpected_e() {
    json::tokenize("-e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '.' found.")]
fn should_panic_unexpected_start_with_dot() {
    json::tokenize(".1").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_after_e() {
    json::tokenize("25e").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_plus_after_e() {
    json::tokenize("3E+").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_minus_after_e() {
    json::tokenize("33e-").unwrap();
}

#[test_case("\"hello\"" ; "simple")]
#[test_case("\"hello\\u32AF\"" ; "unicode_escape")]
#[test_case("\"\\n\\r\\t\\f\\\"\\b\"" ; "normal_escapes")]
fn should_tokenize_strings(code: &str) {
    let result = json::tokenize(code).unwrap();
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
    json::tokenize("\"hello\\u32AX\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '\"' found.")]
fn should_panic_premature_unicode_escape_end() {
    json::tokenize("\"hello\\u32A\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unicode_escape_end_of_input() {
    json::tokenize("\"hello\\u32A").unwrap();
}

#[test]
#[should_panic(expected="Unexpected end of input found.")]
fn should_panic_unexpected_end_of_string() {
    json::tokenize("\"hello").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'x' found.")]
fn should_panic_invalid_escape() {
    json::tokenize("\"\\x\"").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '/' found. (1:1)")]
fn should_panic_line_comment() {
    json::tokenize("// foo").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character '/' found. (1:1)")]
fn should_panic_block_comment() {
    json::tokenize("/* foo */").unwrap();
}

#[test]
#[should_panic(expected="Unexpected character 'o' found. (1:2)")]
fn should_panic_invalid_keyword() {
    json::tokenize("no").unwrap();
}

#[test]
fn should_tokenize_string_with_space() {
    let code = " \"foo\" ";
    let result = json::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::String);
    assert_eq!(&code[result[0].loc.start.offset..result[0].loc.end.offset], "\"foo\"");
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 2,
        offset: 1
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: 7,
        offset: 6
    });
}


//-----------------------------------------------------------------------------
// JSONC Tests
//-----------------------------------------------------------------------------

#[test]
fn should_tokenize_line_comment_without_eol() {
    let code = "// foo";
    let result = jsonc::tokenize(code).unwrap();
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
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::LineComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len(),
        offset: code.len() - 1
    });
}

#[test]
fn should_tokenize_line_comment_with_eol_and_comma() {
    let code = "// foo\n,";
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::LineComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: 7,
        offset: 6
    });
    assert_eq!(result[1].kind, TokenKind::Comma);
    assert_eq!(result[1].loc.start, Location {
        line: 2,
        column: 1,
        offset: 7
    });
    assert_eq!(result[1].loc.end, Location {
        line: 2,
        column: 2,
        offset: code.len()
    });
}

#[test]
fn should_tokenize_block_comment_without_eol() {
    let code = "/* foo */";
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::BlockComment);
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
fn should_tokenize_block_comment_with_eol() {
    let code = "/* foo */\n";
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::BlockComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 1,
        column: code.len(),
        offset: code.len() - 1
    });
}

#[test]
fn should_tokenize_block_comment_with_embedded_newline() {
    let code = "/* foo\nbar*/";
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[0].kind, TokenKind::BlockComment);
    assert_eq!(result[0].loc.start, Location {
        line: 1,
        column: 1,
        offset: 0
    });
    assert_eq!(result[0].loc.end, Location {
        line: 2,
        column: 6,
        offset: 12
    });
}

#[test]
fn should_tokenize_array_with_embedded_comment() {
    let code = "[/* foo\n*/5]";
    let result = jsonc::tokenize(code).unwrap();
    assert_eq!(result[1].kind, TokenKind::BlockComment);
    assert_eq!(result[1].loc.start, Location {
        line: 1,
        column: 2,
        offset: 1
    });
    assert_eq!(result[1].loc.end, Location {
        line: 2,
        column: 3,
        offset: 10
    });
}

#[test]
#[should_panic(expected="Unexpected end of input found. (1:8)")]
fn should_panic_incomplete_block_comment() {
    jsonc::tokenize("/* foo ").unwrap();
}
