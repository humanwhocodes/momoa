
/**
 * @fileoverview Tests for parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import fs from "fs";
import path from "path";
import { expect } from "chai";

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const pkgs = {
    cjs: momoa_cjs,
    esm: momoa_esm,
};

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

describe("parse()", () => {

    Object.entries(pkgs).forEach(([name, { parse }]) => {

        describe(name, () => {

            describe("error", () => {
                it("should throw an error when an unexpected token is found", () => {
                    const text = "\"hi\"123";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token Number found.");
                });

                it("should throw an error when a string isn't closed", () => {
                    const text = "\"hi";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected end of input found.");
                });

                it("should throw an error when an embedded string isn't closed", () => {
                    const text = `{
        "key": [1, 2, {"key: 1}]
        }`;

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected end of input found.");
                });

                it("should throw an error when there is a dangling comma", () => {
                    const text = `{
        "key1": 1,
        }`;

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token RBrace found.");
                });

                it("should throw an error when there is a dangling comma in an array", () => {
                    const text = `[
        1,
        ]`;

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token RBracket found.");
                });
            });

            describe("tokens", () => {
                it("should not return a tokens array", () => {
                    const text = "\"hi\"";
                    const result = parse(text);
                    expect(result.tokens).be.undefined;
                });

                it("should return a tokens array", () => {
                    const text = "\"hi\"";
                    const result = parse(text, { tokens: true });
                    expect(result.tokens).to.deep.equal([
                        {
                            type: "String",
                            loc: {
                                start: { line: 1, column: 1, offset: 0 },
                                end: { line: 1, column: 5, offset: 4 }
                            }
                        }
                    ]);
                });

            });

            describe("fixtures", () => {

                describe("Without range", () => {                    
                    const astsPath = "../fixtures/asts";
                    fs.readdirSync(astsPath).forEach(fileName => {
    
                        const filePath = path.join(astsPath, fileName);
                        const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
                        const separatorIndex = contents.indexOf("---");
    
                        it(`Test in ${fileName} should parse correctly`, () => {
                            const text = contents.slice(0, separatorIndex);
                            const json = contents.slice(separatorIndex + 4).trim();
                            const expected = JSON.parse(json);
                            const result = parse(text, { mode: fileName.includes("jsonc") ? "jsonc" : "json", tokens: true });
                            expect(result).to.deep.equal(expected);
                        });
                    });
                });

                describe("With range", () => {                    
                    const astsPath = "../fixtures/asts-with-range";
                    fs.readdirSync(astsPath).forEach(fileName => {
    
                        const filePath = path.join(astsPath, fileName);
                        const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
                        const separatorIndex = contents.indexOf("---");
    
                        it(`Test in ${fileName} should parse correctly`, () => {
                            const text = contents.slice(0, separatorIndex);
                            const json = contents.slice(separatorIndex + 4).trim();
                            const expected = JSON.parse(json);
                            const result = parse(text, { mode: fileName.includes("jsonc") ? "jsonc" : "json", ranges: true, tokens: true });
                            expect(result).to.deep.equal(expected);
                        });
                    });
                });

            });


        });

    });
});
