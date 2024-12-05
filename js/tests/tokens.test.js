
/**
 * @fileoverview Tests for tokens generator
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import { expect } from "chai";
import json5 from "json5";
//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const pkgs = {
    cjs: momoa_cjs,
    esm: momoa_esm,
};

const validNumbers = ["1", "1.5", "-1.52", "-0.1", "0.17", "0", "1e5",
    "21e-51", "4e+50"
];

const infinities = ["Infinity", "-Infinity", "+Infinity"];
const nans = ["NaN", "-NaN", "+NaN"];
const validJSON5Numbers = [
    ...validNumbers,
    ...infinities,
    ...nans,
    "+1",
    "0x1", "0Xdecaf", "-0x0123456789abcdefABCDEF",
    ".8675309", "8675309."
];

const invalidNumbers = ["01", "-e", ".1", "5.a" ];
const incompleteNumbers = ["5e", /*"1E+", "25e-", "54."*/];

const validStrings = [
    "\"\"", "\"\\u005C\"", "\"\\u002F\"", "\"\\u002f\"", "\"/\"",
    "\"\\b\""
];

const json5ValidStrings = [
    ...validStrings,
    "\"\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\u2028\\u2029\\a\\'\\\"\"",
    "'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\u2028\\u2029\\a\\'\\\"'",
    "\"\\u0061\\u0062\"", "\"\\a\\'\\\"\""
];

const invalidStrings = [
    "\"\\u005X\"", "\"\\x\"", "'hello'"
];

const unknownInput = [
    ".", "a"
];

const json5LineContinuations = [
    "'foo\\\nbar'",
    "'foo\\\rbar'",
    "'foo\\\u2028bar'",
    "'foo\\\u2029bar'",
];

const json5Identifiers = [
    "foo",
    "foo_bar",
    "foo123",
    "$foo",
    "_foo",
    "f\u00F6\u00F6",
    "ùńîċõďë",
    "\\u0061\\u0062"
];


// copied from syntax.js (must be a better way?)

const LBRACKET = "[";
const RBRACKET = "]";
const LBRACE = "{";
const RBRACE = "}";
const COLON = ":";
const COMMA = ",";

const TRUE = "true";
const FALSE = "false";
const NULL = "null";
const NAN = "NaN";

const knownTokenTypes = new Map([
    [LBRACKET, "LBracket"],
    [RBRACKET, "RBracket"],
    [LBRACE, "LBrace"],
    [RBRACE, "RBrace"],
    [COLON, "Colon"],
    [COMMA, "Comma"],
    [TRUE, "Boolean"],
    [FALSE, "Boolean"],
    [NULL, "Null"],
    [NAN, "NaN"]
]);

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

function assertArrayMatches(actual, expected) {

    actual.forEach((value, i) => {
        expect(value).to.deep.equal(expected[i]);
    });

}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("tokenize()", () => {

    Object.entries(pkgs).forEach(([name, { tokenize }]) => {

        describe(name, () => {

            Object.entries(knownTokenTypes).forEach(([tokenKey, tokenType]) => {
                it("should tokenize " + tokenKey + " correctly", () => {
                    const result = tokenize(tokenKey);
                    assertArrayMatches(result, [
                        {
                            type: tokenType, loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: tokenKey.length + 1, offset: tokenKey.length }
                            }
                        }
                    ]);
                });

                it("should tokenize " + tokenKey + " correctly with leading white space", () => {
                    const result = tokenize("    " + tokenKey);
                    assertArrayMatches(result, [
                        {
                            type: tokenType, loc: {
                                start: { line: 1, column: 5, offset: 4 },
                                end: { line: 1, column: tokenKey.length + 5, offset: tokenKey.length + 4 }
                            }
                        }
                    ]);
                });

                it("should tokenize " + tokenKey + " correctly with trailing white space", () => {
                    const result = tokenize(tokenKey + "    ");
                    assertArrayMatches(result, [
                        {
                            type: tokenType, loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: tokenKey.length + 1, offset: tokenKey.length }
                            }
                        }
                    ]);
                });

            });

            validNumbers.forEach(value => {
                it("should tokenize number " + value + " correctly", () => {
                    const result = tokenize(value);
                    assertArrayMatches(result, [
                        {
                            type: "Number", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: value.length + 1, offset: value.length }
                            }
                        }
                    ]);
                });
            });

            invalidNumbers.forEach(value => {
                it("should throw an error when invalid number " + value + " is found", () => {
                    expect(() => {
                        tokenize(value);
                    }).to.throw(/Unexpected character/);
                });
            });

            incompleteNumbers.forEach(value => {
                it("should throw an error when incomplete number " + value + " is found", () => {
                    expect(() => {
                        tokenize(value);
                    }).to.throw(/Unexpected end of input/);
                });
            });


            validStrings.forEach(value => {
                it("should tokenize string " + value + " correctly", () => {
                    const result = tokenize(value);
                    assertArrayMatches(result, [
                        {
                            type: "String", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: value.length + 1, offset: value.length }
                            }
                        }
                    ]);
                });
            });

            invalidStrings.forEach(value => {
                it("should throw an error when invalid string " + value + " is found", () => {
                    expect(() => {
                        tokenize(value);
                    }).to.throw(/Unexpected character/);
                });
            });


            unknownInput.forEach(value => {
                it("should throw an error when an unexpected input is found", () => {
                    expect(() => {
                        tokenize(value);
                    }).to.throw("Unexpected character '" + value.charAt(0) + "' found. (1:1)");
                });
            });

            it("should throw an error when an invalid keyword is found", () => {
                expect(() => {
                    tokenize("no");
                }).to.throw("Unexpected identifier 'no' found. (1:1)");
            });

            it("should throw an error when a string isn't closed", () => {
                expect(() => {
                    tokenize("\"no");
                }).to.throw("Unexpected end of input found. (1:4)");
            });

            describe("JSON5", () => {
                
                it("should tokenize an identifier correctly", () => {
                    const result = tokenize("foo", { mode: "json5" });
                    assertArrayMatches(result, [
                        {
                            type: "Identifier", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: 4, offset: 3 }
                            }
                        }
                    ]);
                });

                it("should tokenize a string with escapes correctly", () => {
                    const text = "'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\\"'";
                    const result = tokenize(text, { mode: "json5" });
                    assertArrayMatches(result, [
                        {
                            type: "String", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 4, column: 12, offset: 43 }
                            }
                        }
                    ]);
                });

                json5LineContinuations.forEach(text => {
                    it(`should tokenize ${text} a string with a line continuation correctly`, () => {
                        const result = tokenize(text, { mode: "json5" });
                        assertArrayMatches(result, [
                            {
                                type: "String", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: text.match(/[\r\n]/) 
                                        ? { line: 2 , column: 5, offset: 10 }
                                        : { line: 1, column: 11, offset: 10 }
                                }
                            }
                        ]);
                    });
                });

                json5ValidStrings.forEach(value => {
                    it("should tokenize JSON5 string " + value + " correctly", () => {
                        json5.parse(value);
                        const result = tokenize(value, { mode: "json5" });
                        assertArrayMatches(result, [
                            {
                                type: "String", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: value.length + 1, offset: value.length }
                                }
                            }
                        ]);
                    });
                });

                it("should tokenize 'foo\\\r\nbar'  with a line continuation correctly", () => {
                    const result = tokenize("'foo\\\r\nbar'", { mode: "json5" });
                    assertArrayMatches(result, [
                        {
                            type: "String", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 2, column: 5, offset: 11 }
                            }
                        }
                    ]);
                });

                it("should properly skip whitespace", () => {
                    const result = tokenize("{\t\v\f \u00A0\uFEFF\n\r\u2028\u2029\u2003}", { mode: "json5" });
                    assertArrayMatches(result, [
                        {
                            type: "LBrace", loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: 2, offset: 1 }
                            }
                        },
                        {
                            type: "RBrace", loc: {
                                start: { line: 3, column: 4, offset: 12 },
                                end: { line: 3, column: 5, offset: 13 }
                            }
                        }
                    ]);
                });

                validJSON5Numbers.forEach(value => {
                    it("should tokenize JSON5 number " + value + " correctly", () => {
                        const result = tokenize(value, { mode: "json5" });
                        assertArrayMatches(result, [
                            {
                                type: "Number", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: value.length + 1, offset: value.length }
                                }
                            }
                        ]);
                    });
                });                

                json5Identifiers.forEach(value => {
                    it("should tokenize JSON5 identifier " + value + " correctly", () => {
                        const result = tokenize(value, { mode: "json5" });
                        assertArrayMatches(result, [
                            {
                                type: "Identifier", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: value.length + 1, offset: value.length }
                                }
                            }
                        ]);
                    });
                });

                it("should throw an error when a JSON5 identifier starts with a unicode sequence for whitespace", () => {
                    expect(() => {
                        tokenize("\\u0020foo", { mode: "json5" });
                    }).to.throw("Unexpected character '\\' found. (1:1)");
                });

                it("should throw an error when a JSON5 identifier contains a unicode sequence for whitespace", () => {
                    expect(() => {
                        tokenize("{ foo\\u0020bar: 1 }", { mode: "json5" });
                    }).to.throw("Unexpected character ' ' found. (1:6)");
                });

            });

            describe("Comments", () => {

                describe("Line Comments", () => {

                    it("should throw an error when a line comment is found and comments aren't enabled", () => {
                        expect(() => {
                            tokenize("// foo");
                        }).to.throw("Unexpected character '/' found. (1:1)");
                    });


                    it("should correctly tokenize when a line comment is found and comments are enabled", () => {
                        const result = tokenize("// foo", { mode: "jsonc" });
                        assertArrayMatches(result, [
                            {
                                type: "LineComment",
                                loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: 7, offset: 6 }
                                }
                            }
                        ]);
                    });

                    it("should correctly tokenize when a line comment is found inside an array and comments are enabled", () => {
                        const result = tokenize("[// foo\n5]", { mode: "jsonc" });
                        assertArrayMatches(result, [
                            {
                                type: "LBracket", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: 2, offset: 1 }
                                }
                            },
                            {
                                type: "LineComment",
                                loc: {
                                    start: { line: 1, column: 2, offset: 1 },
                                    end: { line: 1, column: 8, offset: 7 }
                                }
                            },
                            {
                                type: "Number", loc: {
                                    start: { line: 2, column: 1, offset: 8 },
                                    end: { line: 2, column: 2, offset: 9 }
                                }
                            },
                            {
                                type: "RBracket", loc: {
                                    start: { line: 2, column: 2, offset: 9 },
                                    end: { line: 2, column: 3, offset: 10 }
                                }
                            }
                        ]);
                    });

                });

                describe("Block Comments", () => {

                    it("should throw an error when a block comment is found and comments aren't enabled", () => {
                        expect(() => {
                            tokenize("/* foo */");
                        }).to.throw("Unexpected character '/' found. (1:1)");
                    });

                    it("should throw an error when a block comment is started and not finished", () => {
                        expect(() => {
                            tokenize("/* foo ", { mode: "jsonc" });
                        }).to.throw("Unexpected end of input found. (1:8)");
                    });

                    it("should correctly tokenize when a block comment is found and comments are enabled", () => {
                        const result = tokenize("/* foo\nbar*/", { mode: "jsonc" });
                        assertArrayMatches(result, [
                            {
                                type: "BlockComment",
                                loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 2, column: 6, offset: 12 }
                                }
                            }
                        ]);
                    });

                    it("should correctly tokenize when a block comment is found inside an array and comments are enabled", () => {
                        const result = tokenize("[/* foo\n*/5]", { mode: "jsonc" });
                        assertArrayMatches(result, [
                            {
                                type: "LBracket", loc: {
                                    start: { line: 1, column: 1, offset: 0 },
                                    end: { line: 1, column: 2, offset: 1 }
                                }
                            },
                            {
                                type: "BlockComment",
                                loc: {
                                    start: { line: 1, column: 2, offset: 1 },
                                    end: { line: 2, column: 3, offset: 10 }
                                }
                            },
                            {
                                type: "Number", loc: {
                                    start: { line: 2, column: 3, offset: 10 },
                                    end: { line: 2, column: 4, offset: 11 }
                                }
                            },
                            {
                                type: "RBracket", loc: {
                                    start: { line: 2, column: 4, offset: 11 },
                                    end: { line: 2, column: 5, offset: 12 }
                                }
                            }
                        ]);
                    });


                });

            });

            it("should tokenize array when there are multiple values", () => {
                const result = tokenize("[1, true, null, false]");
                assertArrayMatches(result, [
                    {
                        type: "LBracket", loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "Number", loc: {
                            start: { line: 1, column: 2, offset: 1 },
                            end: { line: 1, column: 3, offset: 2 }
                        }
                    },
                    {
                        type: "Comma", loc: {
                            start: { line: 1, column: 3, offset: 2 },
                            end: { line: 1, column: 4, offset: 3 }
                        }
                    },
                    {
                        type: "Boolean", loc: {
                            start: { line: 1, column: 5, offset: 4 },
                            end: { line: 1, column: 9, offset: 8 }
                        }
                    },
                    {
                        type: "Comma", loc: {
                            start: { line: 1, column: 9, offset: 8 },
                            end: { line: 1, column: 10, offset: 9 }
                        }
                    },
                    {
                        type: "Null", loc: {
                            start: { line: 1, column: 11, offset: 10 },
                            end: { line: 1, column: 15, offset: 14 }
                        }
                    },
                    {
                        type: "Comma", loc: {
                            start: { line: 1, column: 15, offset: 14 },
                            end: { line: 1, column: 16, offset: 15 }
                        }
                    },
                    {
                        type: "Boolean", loc: {
                            start: { line: 1, column: 17, offset: 16 },
                            end: { line: 1, column: 22, offset: 21 }
                        }
                    },
                    {
                        type: "RBracket", loc: {
                            start: { line: 1, column: 22, offset: 21 },
                            end: { line: 1, column: 23, offset: 22 }
                        }
                    }
                ]);
            });

            it("should tokenize object when there are multiple properties", () => {
                const result = tokenize("{\"foo\":1, \"bar\": true}");
                assertArrayMatches(result, [
                    {
                        type: "LBrace", loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "String", loc: {
                            start: { line: 1, column: 2, offset: 1 },
                            end: { line: 1, column: 7, offset: 6 }
                        }
                    },
                    {
                        type: "Colon", loc: {
                            start: { line: 1, column: 7, offset: 6 },
                            end: { line: 1, column: 8, offset: 7 }
                        }
                    },
                    {
                        type: "Number", loc: {
                            start: { line: 1, column: 8, offset: 7 },
                            end: { line: 1, column: 9, offset: 8 }
                        }
                    },
                    {
                        type: "Comma", loc: {
                            start: { line: 1, column: 9, offset: 8 },
                            end: { line: 1, column: 10, offset: 9 }
                        }
                    },
                    {
                        type: "String", loc: {
                            start: { line: 1, column: 11, offset: 10 },
                            end: { line: 1, column: 16, offset: 15 }
                        }
                    },
                    {
                        type: "Colon", loc: {
                            start: { line: 1, column: 16, offset: 15 },
                            end: { line: 1, column: 17, offset: 16 }
                        }
                    },
                    {
                        type: "Boolean", loc: {
                            start: { line: 1, column: 18, offset: 17 },
                            end: { line: 1, column: 22, offset: 21 }
                        }
                    },
                    {
                        type: "RBrace", loc: {
                            start: { line: 1, column: 22, offset: 21 },
                            end: { line: 1, column: 23, offset: 22 }
                        }
                    }
                ]);
            });

            it("should tokenize objects differently when they have different line endings", () => {
                const result1 = tokenize("{\n\n\"b\": 2}");
                const result2 = tokenize("{\r\n\r\n\"b\": 2}");
                assertArrayMatches(result1, [
                    {
                        type: "LBrace",
                        loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "String",
                        loc: {
                            start: { line: 3, column: 1, offset: 3 },
                            end: { line: 3, column: 4, offset: 6 }
                        }
                    },
                    {
                        type: "Colon",
                        loc: {
                            start: { line: 3, column: 4, offset: 6 },
                            end: { line: 3, column: 5, offset: 7 }
                        }
                    },
                    {
                        type: "Number",
                        loc: {
                            start: { line: 3, column: 6, offset: 8 },
                            end: { line: 3, column: 7, offset: 9 }
                        }
                    },
                    {
                        type: "RBrace",
                        loc: {
                            start: { line: 3, column: 7, offset: 9 },
                            end: { line: 3, column: 8, offset: 10 }
                        }
                    }
                ]);

                assertArrayMatches(result2, [
                    {
                        type: "LBrace",
                        loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "String",
                        loc: {
                            start: { line: 3, column: 1, offset: 5 },
                            end: { line: 3, column: 4, offset: 8 }
                        }
                    },
                    {
                        type: "Colon",
                        loc: {
                            start: { line: 3, column: 4, offset: 8 },
                            end: { line: 3, column: 5, offset: 9 }
                        }
                    },
                    {
                        type: "Number",
                        loc: {
                            start: { line: 3, column: 6, offset: 10 },
                            end: { line: 3, column: 7, offset: 11 }
                        }
                    },
                    {
                        type: "RBrace",
                        loc: {
                            start: { line: 3, column: 7, offset: 11 },
                            end: { line: 3, column: 8, offset: 12 }
                        }
                    }
                ]);
            });

        });
    });
});
