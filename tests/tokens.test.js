
/**
 * @fileoverview Tests for tokens generator
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { tokenTypes, tokens } from "../src/tokens.js";
import chai from "chai";

const expect = chai.expect;

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

    Object.entries(tokenTypes).forEach(([tokenKey, tokenType]) => {
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



    it("should throw an error when an invalid keyword is found", () => { 
        expect(() => {
            [...tokens("no")];
        }).to.throw("Unexpected character o at 1:2");
    });


});