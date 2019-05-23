
/**
 * @fileoverview Tool to generate test data files
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { parse } from "../src/parse.js";
import fs from "fs";
import path from "path";

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

const validArrays = [
    "[1, true, null, \"hi\"]",
    "[]",
    "[1]",
    "[1, 2]",
    "[ true ]",
    "[ \"foo \"]",
    "[{}]"
]

const validObjects = [
    "{\"foo\":1}",
    `{ "message": "Hello world!" }`,
    `{ "foo": 1, "bar": true, "baz": null}`,
    `{ "items": [1, 2, { "foo": 1 } ]}`
];

const astsPath = "./tests/asts";
validObjects.forEach((text, i) => {
    console.log(text);
    const filePath = path.join(astsPath, "object-" + (i + 1) + ".txt");
    const result = parse(text);
    fs.writeFileSync(filePath, text + "\n---\n" + JSON.stringify(result, null, "    "), "utf8");
});



// fs.readdirSync(astsPath).forEach(fileName => {

//     const filePath = path.join(astsPath, fileName);
//     const contents = fs.readFileSync(filePath, "utf8");
//     const separatorIndex = contents.indexOf("---");
//     const text = contents.slice(0, separatorIndex);
//     const json = contents.slice(separatorIndex + 5).trim();

//     it(`Test in ${fileName} should parse correctly`, () => {
//         expect(result).to.deep.equal(expected);
//     });
// });


