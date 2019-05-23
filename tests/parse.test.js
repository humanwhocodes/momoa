
/**
 * @fileoverview Tests for parser
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { parse } from "../src/parse.js";
import fs from "fs";
import path from "path";
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

const unknownInput = [
    ".", "a"
];


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

    const astsPath = "./tests/asts";
    fs.readdirSync(astsPath).forEach(fileName => {
        
        const filePath = path.join(astsPath, fileName);
        const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");;
        const separatorIndex = contents.indexOf("---");
        
        it(`Test in ${ fileName } should parse correctly`, () => {
            const text = contents.slice(0, separatorIndex);
            const json = contents.slice(separatorIndex + 4).trim();
            const expected = JSON.parse(json);
            const result = parse(text);
            expect(result).to.deep.equal(expected);
        });
    });

});