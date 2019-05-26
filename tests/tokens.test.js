
/**
 * @fileoverview Tests for tokens generator
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { knownTokenTypes, tokens } = require("../");
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const validNumbers = [ "1", "1.5", "-1.52", "-0.1", "0.17", "0", "1e5", 
    "21e-51", "4e+50"
];

const invalidNumbers = [ "01", "-e", ".1" ];

const validStrings = [
    "\"\"", "\"\\u005C\"", "\"\\u002F\"", "\"\\u002f\"", "\"\/\"", "\"/\"",
    "\"\\b\""
];

const invalidStrings = [
    "\"\\u005X\"", "\"\\x\""
];

const unknownInput = [
    ".", "a"
];

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

describe("tokens()", () => {

    Object.entries(knownTokenTypes).forEach(([tokenKey, tokenType]) => {
        it("should tokenize " + tokenKey + " correctly", () => {
            const result = [...tokens(tokenKey)];
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 1, index: 0 },
                    end: { line: 1, column: tokenKey.length + 1, index: tokenKey.length }
                }}
            ])
        });

        it("should tokenize " + tokenKey + " correctly with leading white space", () => {
            const result = [...tokens("    " + tokenKey)];
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 5, index: 4 },
                    end: { line: 1, column: tokenKey.length + 5, index: tokenKey.length + 4 }
                }}
            ])
        });

        it("should tokenize " + tokenKey + " correctly with trailing white space", () => {
            const result = [...tokens(tokenKey + "    ")];
            assertArrayMatches(result, [
                { type: tokenType, value: tokenKey, loc: {
                    start: { line: 1, column: 1, index: 0 },
                    end: { line: 1, column: tokenKey.length + 1, index: tokenKey.length }
                }}
            ])
        });

    });

    validNumbers.forEach(value => {
        it("should tokenize number " + value + " correctly", () => {
            const result = [...tokens(value)];
            assertArrayMatches(result, [
                { type: "Number", value: value, loc: {
                    start: { line: 1, column: 1, index: 0 },
                    end: { line: 1, column: value.length + 1, index: value.length }
                }}
            ])
        });
    });

    invalidNumbers.forEach(value => {
        it("should throw an error when invalid number " + value + " is found", () => {
            expect(() => {
                [...tokens(value)];
            }).to.throw(/Unexpected character/);
        });
    });


    validStrings.forEach(value => {
        it("should tokenize string " + value + " correctly", () => {
            const result = [...tokens(value)];
            assertArrayMatches(result, [
                {
                    type: "String", value: value, loc: {
                        start: { line: 1, column: 1, index: 0 },
                        end: { line: 1, column: value.length + 1, index: value.length }
                    }
                }
            ])
        });
    });

    invalidStrings.forEach(value => {
        it("should throw an error when invalid string " + value + " is found", () => {
            expect(() => {
                [...tokens(value)];
            }).to.throw(/Unexpected character/);
        });
    });


    unknownInput.forEach(value => {
        it("should throw an error when an unexpected input is found", () => {
            expect(() => {
                [...tokens(value)];
            }).to.throw("Unexpected character " + value.charAt(0) + " found. (1:1)");
        });
    });

    it("should throw an error when an invalid keyword is found", () => { 
        expect(() => {
            [...tokens("no")];
        }).to.throw("Unexpected character o found. (1:2)");
    });

    it("should tokenize array when there are multiple values", () => {
        const result = [...tokens("[1, true, null, false]")];
        assertArrayMatches(result, [
            {
                type: "Punctuator", value: "[", loc: {
                    start: { line: 1, column: 1, index: 0 },
                    end: { line: 1, column: 2, index: 1 }
                }
            },
            {
                type: "Number", value: "1", loc: {
                    start: { line: 1, column: 2, index: 1 },
                    end: { line: 1, column: 3, index: 2 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 3, index: 2 },
                    end: { line: 1, column: 4, index: 3 }
                }
            },
            {
                type: "Boolean", value: "true", loc: {
                    start: { line: 1, column: 5, index: 4 },
                    end: { line: 1, column: 9, index: 8 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 9, index: 8 },
                    end: { line: 1, column: 10, index: 9 }
                }
            },
            {
                type: "Null", value: "null", loc: {
                    start: { line: 1, column: 11, index: 10 },
                    end: { line: 1, column: 15, index: 14 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 15, index: 14 },
                    end: { line: 1, column: 16, index: 15 }
                }
            },
            {
                type: "Boolean", value: "false", loc: {
                    start: { line: 1, column: 17, index: 16 },
                    end: { line: 1, column: 22, index: 21 }
                }
            },
            {
                type: "Punctuator", value: "]", loc: {
                    start: { line: 1, column: 22, index: 21 },
                    end: { line: 1, column: 23, index: 22 }
                }
            }
        ])
    });

    it("should tokenize object when there are multiple properties", () => {
        const result = [...tokens("{\"foo\":1, \"bar\": true}")];
        assertArrayMatches(result, [
            {
                type: "Punctuator", value: "{", loc: {
                    start: { line: 1, column: 1, index: 0 },
                    end: { line: 1, column: 2, index: 1 }
                }
            },
            {
                type: "String", value: "\"foo\"", loc: {
                    start: { line: 1, column: 2, index: 1 },
                    end: { line: 1, column: 7, index: 6 }
                }
            },
            {
                type: "Punctuator", value: ":", loc: {
                    start: { line: 1, column: 7, index: 6 },
                    end: { line: 1, column: 8, index: 7 }
                }
            },
            {
                type: "Number", value: "1", loc: {
                    start: { line: 1, column: 8, index: 7 },
                    end: { line: 1, column: 9, index: 8 }
                }
            },
            {
                type: "Punctuator", value: ",", loc: {
                    start: { line: 1, column: 9, index: 8 },
                    end: { line: 1, column: 10, index: 9 }
                }
            },
            {
                type: "String", value: "\"bar\"", loc: {
                    start: { line: 1, column: 11, index: 10 },
                    end: { line: 1, column: 16, index: 15 }
                }
            },
            {
                type: "Punctuator", value: ":", loc: {
                    start: { line: 1, column: 16, index: 15 },
                    end: { line: 1, column: 17, index: 16 }
                }
            },
            {
                type: "Boolean", value: "true", loc: {
                    start: { line: 1, column: 18, index: 17 },
                    end: { line: 1, column: 22, index: 21 }
                }
            },
            {
                type: "Punctuator", value: "}", loc: {
                    start: { line: 1, column: 22, index: 21 },
                    end: { line: 1, column: 23, index: 22 }
                }
            }
        ])
    });


});