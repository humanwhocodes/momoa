
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
                { type: tokenType, value: tokenKey, range: [0, tokenKey.length], loc: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: tokenKey.length + 1 }
                }}
            ])
        });

    });

    it("should throw an error when an invalid keyword is found", () => { 
        expect(() => {
            [...tokens("no")];
        }).to.throw("Unexpected character o at 1:2");
    });


});