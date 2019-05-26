
/**
 * @fileoverview Tests for parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { parse } = require("../");
const fs = require("fs");
const path = require("path");
const { expect } = require("chai");

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

function loc(value, { line = 1, column = 1, index = column - 1}) {
    return {
        start: {
            line,
            column,
            index
        },
        end: {
            line: line,
            column: column + value.length,
            index: index + value.length
        }
    };
}

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("parse()", () => {

    describe("error", () => {
        it("should throw an error when an unexpected token is found", () => {
            const text = "\"hi\"123";

            expect(() => {
                parse(text);
            }).to.throw("Unexpected token Number(123) found.");
        });
    });

    describe("tokens", () => {
        it("should return a tokens array when tokens:true is passed", () => {
            const text = "\"hi\"";
            const result = parse(text, { tokens: true });
            expect(result.tokens).to.deep.equal([
                {
                    type: "String",
                    value: "\"hi\"",
                    loc: {
                        start: { line: 1, column: 1, index: 0 },
                        end: { line: 1, column: 5, index: 4}
                    }
                }
            ])
        });

        it("should not return a tokens array when tokens is not passed", () => {
            const text = "\"hi\"";
            const result = parse(text);
            expect(result.tokens).to.be.undefined;
        });

        it("should not return a tokens array when tokens:false is passed", () => {
            const text = "\"hi\"";
            const result = parse(text, { tokens: false });
            expect(result.tokens).to.be.undefined;
        });
    });

    describe("fixtures", () => {
        const astsPath = "./tests/fixtures/asts";
        fs.readdirSync(astsPath).forEach(fileName => {
            
            const filePath = path.join(astsPath, fileName);
            const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");;
            const separatorIndex = contents.indexOf("---");
            
            it(`Test in ${ fileName } should parse correctly`, () => {
                const text = contents.slice(0, separatorIndex);
                const json = contents.slice(separatorIndex + 4).trim();
                const expected = JSON.parse(json);
                const result = parse(text, { tokens: true });
                expect(result).to.deep.equal(expected);
            });
        });
    });


});