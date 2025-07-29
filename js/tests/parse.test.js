
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
import json5 from "json5";

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

                it("should throw an error when an object isn't closed", () => {
                    const text = "{\"foo\": \"bar\"";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected end of input found.");
                });

                it("should throw an error when an object with one complete property isn't closed", () => {
                    const text = "{\"foo\": \"bar\", \"baz\": 1";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected end of input found.");
                });

                it("should throw an error when an object doesn't have a comma after the first property", () => {
                    const text = "{\"foo\": \"bar\" \"baz\": 1}";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token String found.");
                });

                it("should throw an error when an object doesn't have a comma after the first property and has an identifier in the second property key", () => {
                    const text = "{\"foo\": \"bar\" baz: 1}";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected character 'b' found.");
                });

                it("should throw an error when an object doesn't have a comma after the first property and has an identifier in the second property value", () => {
                    const text = "{\"foo\": \"bar\" \"baz\": c}";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token String found.");
                });

                it("should throw an error when a dangling comma is found in json mode", () => {
                    const text = "{\"foo\": \"bar\",}";

                    expect(() => {
                        parse(text);
                    }).to.throw("Unexpected token RBrace found.");
                });

                it("should throw an error when a dangling comma is found in jsonc mode", () => {
                    const text = "{\"foo\": \"bar\",}";

                    expect(() => {
                        parse(text, { mode: "jsonc" });
                    }).to.throw("Unexpected token RBrace found.");
                });

                describe("JSON5", () => {
                    it("should throw an error when +NaN is used as a property key", () => {
                        const text = "{ +NaN: 1 }";

                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when -Infinity is used as a property key", () => {
                        const text = "{ -Infinity: 1 }";

                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when 123 is used as a property key", () => {
                        const text = "{ 123: 1 }";

                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when +NaN is used as a property key", () => {
                        const text = "{ +NaN: 1 }";
                        
                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when -NaN is used as a property key", () => {
                        const text = "{ -NaN: 1 }";

                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when +Infinity is used as a property key", () => {
                        const text = "{ +Infinity: 1 }";
                        
                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

                    it("should throw an error when -Infinity is used as a property key", () => {
                        const text = "{ -Infinity: 1 }";

                        expect(() => {
                            parse(text, { mode: "json5" });
                        }).to.throw("Unexpected token Number found.");
                    });

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

            describe("JSON5", () => {
                it("should always allow dangling commas in json5 mode", () => {
                    const text = "{\"foo\": \"bar\",}";
                    const result = parse(text, { mode: "json5", allowTrailingCommas: false });

                    expect(result).to.be.an("object");
                });

                it("should parse a negative hex number correctly", () => {
                    const text = "-0x1";
                    const result = parse(text, { mode: "json5" });
                    expect(result.body.value).to.equal(-1);
                });

                it("should parse a positive hex number correctly", () => {
                    const text = "+0x1";
                    const result = parse(text, { mode: "json5" });
                    expect(result.body.value).to.equal(1);
                });

                it("should parse an unsigned hex number correctly", () => {
                    const text = "0x1";
                    const result = parse(text, { mode: "json5" });
                    expect(result.body.value).to.equal(1);
                });

                it("should unescape unquoted property names", () => {
                    const text = "{ f\\u006fo: 1 }";
                    const expected = json5.parse(text);
                    const result = parse(text, { mode: "json5" });
                    expect(result.body.members[0].name.name).to.equal(Object.keys(expected)[0]);
                });

                it("should unescape unquoted property names", () => {
                    const text = "{ f\\u006Fo: 1 }";
                    const expected = json5.parse(text);
                    const result = parse(text, { mode: "json5" });
                    expect(result.body.members[0].name.name).to.equal(Object.keys(expected)[0]);
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
                            const text = contents.slice(0, separatorIndex).replace(/\n$/, "");
                            const json = contents.slice(separatorIndex + 4).trim();
                            const expected = JSON.parse(json);
                            let mode = "json";
                            if (fileName.includes("jsonc")) {
                                mode = "jsonc";
                            } else if (fileName.includes("json5")) {
                                mode = "json5";
                            }

                            const allowTrailingCommas = fileName.includes("trailing-comma");
                            const result = parse(text, { mode, tokens: true, allowTrailingCommas });
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
                            const text = contents.slice(0, separatorIndex).replace(/\n$/, "");
                            const json = contents.slice(separatorIndex + 4).trim();
                            const expected = JSON.parse(json);
                            let mode = "json";
                            if (fileName.includes("jsonc")) {
                                mode = "jsonc";
                            } else if (fileName.includes("json5")) {
                                mode = "json5";
                            }
                            const allowTrailingCommas = fileName.includes("trailing-comma");
                            const result = parse(text, { mode, ranges: true, tokens: true, allowTrailingCommas });
                            expect(result).to.deep.equal(expected);
                        });
                    });
                });

            });

            describe("Strings", () => {
                it("should parse string escapes correctly without crashing Node.js", () => {
                    const text = "'\\b\\f\\n\\r\\t\\v\\0\\x0f\\u01fF\\\n\\\r\n\\\r\\\u2028\\\u2029\\a\\'\\\"'";
                    const result = parse(text, { mode: "json5" });
                    const expected = json5.parse(text);

                    expect(result.body.value).to.deep.equal(expected);
                });

                it("should parse a string with \\u2028 correctly" , () => {
                    const text = "foo\\\u2029bar";
                    const textToParse = json5.stringify(text);
                    const result = parse(textToParse, { mode: "json5" });
                    const expected = json5.parse(textToParse);

                    expect(result.body.value).to.deep.equal(expected);
                });
            });

            describe("Document range and location", () => {
                it("should include trailing whitespace in document range and location", () => {
                    const text = " {} ";
                    const result = parse(text, { ranges: true });
                    
                    expect(result.loc.start).to.deep.equal({ line: 1, column: 1, offset: 0 });
                    expect(result.loc.end).to.deep.equal({ line: 1, column: 5, offset: 4 });
                    expect(result.range).to.deep.equal([0, 4]);
                });

                it("should include trailing newline in document range and location", () => {
                    const text = "{}\n";
                    const result = parse(text, { ranges: true });
                    
                    expect(result.loc.start).to.deep.equal({ line: 1, column: 1, offset: 0 });
                    expect(result.loc.end).to.deep.equal({ line: 2, column: 1, offset: 3 });
                    expect(result.range).to.deep.equal([0, 3]);
                });
            });
        });

    });
});
