
/**
 * @fileoverview Tool to generate test data files
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const { parse } = require("../api");
const fs = require("fs");
const path = require("path");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const invalidNumbers = [ "01", "-e", ".1" ];

const invalidStrings = [
    "\"\\u005X\"", "\"\\x\""
];

const unknownInput = [
    ".", "a"
];


//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const astsPath = "./tests/fixtures/asts";
fs.readdirSync(astsPath).forEach(fileName => {

    const filePath = path.join(astsPath, fileName);
    const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
    const separatorIndex = contents.indexOf("---");

    // Note there is a \n before the separator, so chop it off
    const text = contents.slice(0, separatorIndex - 1);
    const json = contents.slice(separatorIndex + 4).trim();
    const result = parse(text, { tokens: true, comments: true, ranges: true });
    fs.writeFileSync(filePath, text + "\n---\n" + JSON.stringify(result, null, "    "), "utf8");
});
