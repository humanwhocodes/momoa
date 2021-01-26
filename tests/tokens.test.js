
/**
 * @fileoverview Tests for tokens generator
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { tokenize } = require("../");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const validNumbers = [ "1", "1.5", "-1.52", "-0.1", "0.17", "0", "1e5", 
    "21e-51", "4e+50"
];

const invalidNumbers = [ "01", "-e", ".1" ];

const validStrings = [
    "\"\"", "\"\\u005C\"", "\"\\u002F\"", "\"\\u002f\"", "\"/\"", "\"/\"",
    "\"\\b\""
];

const invalidStrings = [
    "\"\\u005X\"", "\"\\x\""
];

const unknownInput = [
    ".", "a"
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

const knownTokenTypes = new Map([
    [LBRACKET, "Punctuator"],
    [RBRACKET, "Punctuator"],
    [LBRACE, "Punctuator"],
    [RBRACE, "Punctuator"],
    [COLON, "Punctuator"],
    [COMMA, "Punctuator"],
    [TRUE, "Boolean"],
    [FALSE, "Boolean"],
    [NULL, "Null"]
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

    Object.entries(knownTokenTypes).forEach(([tokenKey, tokenType]) => {
        it("should tokenize " + tokenKey + " correctly", () => {
            const result = tokenize(tokenKey);
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: tokenKey.length + 1, offset: tokenKey.length }
                }}
            ]);
        });

        it("should tokenize " + tokenKey + " correctly with leading white space", () => {
            const result = tokenize("    " + tokenKey);
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 5, offset: 4 },
                    end: { line: 1, column: tokenKey.length + 5, offset: tokenKey.length + 4 }
                }}
            ]);
        });

        it("should tokenize " + tokenKey + " correctly with trailing white space", () => {
            const result = tokenize(tokenKey + "    ");
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: tokenKey.length + 1, offset: tokenKey.length }
                }}
            ]);
        });

    });

    validNumbers.forEach(value => {
        it("should tokenize number " + value + " correctly", () => {
            const result = tokenize(value);
            assertArrayMatches(result, [
                { type: "Number", value: value, loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: value.length + 1, offset: value.length }
                }}
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


    validStrings.forEach(value => {
        it("should tokenize string " + value + " correctly", () => {
            const result = tokenize(value);
            assertArrayMatches(result, [
                {
                    type: "String", value: value, loc: {
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
            }).to.throw("Unexpected character " + value.charAt(0) + " found. (1:1)");
        });
    });

    it("should throw an error when an invalid keyword is found", () => { 
        expect(() => {
            tokenize("no");
        }).to.throw("Unexpected character o found. (1:2)");
    });

    it("should throw an error when a string isn't closed", () => { 
        expect(() => {
            tokenize("\"no");
        }).to.throw("Unexpected end of input found. (1:4)");
    });

    describe("Comments", () => {

        describe("Line Comments", () => {

            it("should throw an error when a line comment is found and comments aren't enabled", () => { 
                expect(() => {
                    tokenize("// foo");
                }).to.throw("Unexpected character / found. (1:1)");
            });
    
            
            it("should correctly tokenize when a line comment is found and comments are enabled", () => { 
                const result = tokenize("// foo", { comments: true });
                assertArrayMatches(result, [
                    {
                        type: "LineComment", value: "// foo",
                        loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 7, offset: 6 }
                        }
                    }
                ]); 
            });
            
            it("should correctly tokenize when a line comment is found inside an array and comments are enabled", () => { 
                const result = tokenize("[// foo\n5]", { comments: true });
                assertArrayMatches(result, [
                    {
                        type: "Punctuator", value: "[", loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "LineComment", value: "// foo",
                        loc: {
                            start: { line: 1, column: 2, offset: 1 },
                            end: { line: 1, column: 8, offset: 7 }
                        }
                    },
                    {
                        type: "Number", value: "5", loc: {
                            start: { line: 2, column: 1, offset: 8 },
                            end: { line: 2, column: 2, offset: 9 }
                        }
                    },
                    {
                        type: "Punctuator", value: "]", loc: {
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
                }).to.throw("Unexpected character / found. (1:1)");
            });

            it("should throw an error when a block comment is started and not finished", () => { 
                expect(() => {
                    tokenize("/* foo ", { comments: true });
                }).to.throw("Unexpected end of input found. (1:8)");
            });

            it("should correctly tokenize when a block comment is found and comments are enabled", () => { 
                const result = tokenize("/* foo\nbar*/", { comments: true });
                assertArrayMatches(result, [
                    {
                        type: "BlockComment", value: "/* foo\nbar*/",
                        loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 2, column: 6, offset: 12 }
                        }
                    }
                ]); 
            });

            it("should correctly tokenize when a block comment is found inside an array and comments are enabled", () => {
                const result = tokenize("[/* foo\n*/5]", { comments: true });
                assertArrayMatches(result, [
                    {
                        type: "Punctuator", value: "[", loc: {
                            start: { line: 1, column: 1, offset: 0 },
                            end: { line: 1, column: 2, offset: 1 }
                        }
                    },
                    {
                        type: "BlockComment", value: "/* foo\n*/",
                        loc: {
                            start: { line: 1, column: 2, offset: 1 },
                            end: { line: 2, column: 3, offset: 10 }
                        }
                    },
                    {
                        type: "Number", value: "5", loc: {
                            start: { line: 2, column: 3, offset: 10 },
                            end: { line: 2, column: 4, offset: 11 }
                        }
                    },
                    {
                        type: "Punctuator", value: "]", loc: {
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
                type: "Punctuator", value: "[", loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: 2, offset: 1 }
                }
            },
            {
                type: "Number", value: "1", loc: {
                    start: { line: 1, column: 2, offset: 1 },
                    end: { line: 1, column: 3, offset: 2 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 3, offset: 2 },
                    end: { line: 1, column: 4, offset: 3 }
                }
            },
            {
                type: "Boolean", value: "true", loc: {
                    start: { line: 1, column: 5, offset: 4 },
                    end: { line: 1, column: 9, offset: 8 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 9, offset: 8 },
                    end: { line: 1, column: 10, offset: 9 }
                }
            },
            {
                type: "Null", value: "null", loc: {
                    start: { line: 1, column: 11, offset: 10 },
                    end: { line: 1, column: 15, offset: 14 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 15, offset: 14 },
                    end: { line: 1, column: 16, offset: 15 }
                }
            },
            {
                type: "Boolean", value: "false", loc: {
                    start: { line: 1, column: 17, offset: 16 },
                    end: { line: 1, column: 22, offset: 21 }
                }
            },
            {
                type: "Punctuator", value: "]", loc: {
                    start: { line: 1, column: 22, offset: 21 },
                    end: { line: 1, column: 23, offset: 22 }
                }
            }
        ]);
    });

    it("should tokenize array when there are multiple values with ranges", () => {
        const result = tokenize("[1, true, null, false]", { ranges: true });
        assertArrayMatches(result, [
            {
                type: "Punctuator", value: "[", loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: 2, offset: 1 }
                }, range: [0, 1]
            },
            {
                type: "Number", value: "1", loc: {
                    start: { line: 1, column: 2, offset: 1 },
                    end: { line: 1, column: 3, offset: 2 }
                }, range: [1, 2]
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 3, offset: 2 },
                    end: { line: 1, column: 4, offset: 3 }
                }, range: [2, 3]
            },
            {
                type: "Boolean", value: "true", loc: {
                    start: { line: 1, column: 5, offset: 4 },
                    end: { line: 1, column: 9, offset: 8 }
                }, range: [4, 8]
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 9, offset: 8 },
                    end: { line: 1, column: 10, offset: 9 }
                }, range: [8, 9]
            },
            {
                type: "Null", value: "null", loc: {
                    start: { line: 1, column: 11, offset: 10 },
                    end: { line: 1, column: 15, offset: 14 }
                }, range: [10, 14]
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 15, offset: 14 },
                    end: { line: 1, column: 16, offset: 15 }
                }, range: [14, 15]
            },
            {
                type: "Boolean", value: "false", loc: {
                    start: { line: 1, column: 17, offset: 16 },
                    end: { line: 1, column: 22, offset: 21 }
                }, range: [16, 21]
            },
            {
                type: "Punctuator", value: "]", loc: {
                    start: { line: 1, column: 22, offset: 21 },
                    end: { line: 1, column: 23, offset: 22 }
                }, range: [21, 22]
            }
        ]);
    });

    it("should tokenize object when there are multiple properties", () => {
        const result = tokenize("{\"foo\":1, \"bar\": true}");
        assertArrayMatches(result, [
            {
                type: "Punctuator", value: "{", loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: 2, offset: 1 }
                }
            },
            {
                type: "String", value: "\"foo\"", loc: {
                    start: { line: 1, column: 2, offset: 1 },
                    end: { line: 1, column: 7, offset: 6 }
                }
            },
            {
                type: "Punctuator", value: ":", loc: {
                    start: { line: 1, column: 7, offset: 6 },
                    end: { line: 1, column: 8, offset: 7 }
                }
            },
            {
                type: "Number", value: "1", loc: {
                    start: { line: 1, column: 8, offset: 7 },
                    end: { line: 1, column: 9, offset: 8 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 9, offset: 8 },
                    end: { line: 1, column: 10, offset: 9 }
                }
            },
            {
                type: "String", value: "\"bar\"", loc: {
                    start: { line: 1, column: 11, offset: 10 },
                    end: { line: 1, column: 16, offset: 15 }
                }
            },
            {
                type: "Punctuator", value: ":", loc: {
                    start: { line: 1, column: 16, offset: 15 },
                    end: { line: 1, column: 17, offset: 16 }
                }
            },
            {
                type: "Boolean", value: "true", loc: {
                    start: { line: 1, column: 18, offset: 17 },
                    end: { line: 1, column: 22, offset: 21 }
                }
            },
            {
                type: "Punctuator", value: "}", loc: {
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
                type: "Punctuator",
                value: "{",
                loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: 2, offset: 1 }
                }
            },
            {
                type: "String",
                value: "\"b\"",
                loc: {
                    start: { line: 3, column: 1, offset: 3 },
                    end: { line: 3, column: 4, offset: 6 }
                }
            },
            {
                type: "Punctuator",
                value: ":",
                loc: {
                    start: { line: 3, column: 4, offset: 6 },
                    end: { line: 3, column: 5, offset: 7 }
                }
            },
            {
                type: "Number",
                value: "2",
                loc: {
                    start: { line: 3, column: 6, offset: 8 },
                    end: { line: 3, column: 7, offset: 9 }
                }
            },
            {
                type: "Punctuator",
                value: "}",
                loc: {
                    start: { line: 3, column: 7, offset: 9 },
                    end: { line: 3, column: 8, offset: 10 }
                }
            }
        ]);

        assertArrayMatches(result2, [
            {
                type: "Punctuator",
                value: "{",
                loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: 2, offset: 1 }
                }
            },
            {
                type: "String",
                value: "\"b\"",
                loc: {
                    start: { line: 3, column: 1, offset: 5 },
                    end: { line: 3, column: 4, offset: 8 }
                }
            },
            {
                type: "Punctuator",
                value: ":",
                loc: {
                    start: { line: 3, column: 4, offset: 8 },
                    end: { line: 3, column: 5, offset: 9 }
                }
            },
            {
                type: "Number",
                value: "2",
                loc: {
                    start: { line: 3, column: 6, offset: 10 },
                    end: { line: 3, column: 7, offset: 11 }
                }
            },
            {
                type: "Punctuator",
                value: "}",
                loc: {
                    start: { line: 3, column: 7, offset: 11 },
                    end: { line: 3, column: 8, offset: 12 }
                }
            }
        ]);
    });

});
