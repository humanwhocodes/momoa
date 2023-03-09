
/**
 * @fileoverview Tool to generate test data files
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { parse } from "../src/index.js";
import fs from "node:fs";
import path from "node:path";

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

const astsPath = "../fixtures/asts";
fs.readdirSync(astsPath).forEach(fileName => {

    const filePath = path.join(astsPath, fileName);
    const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
    const separatorIndex = contents.indexOf("---");

    // Note there is a \n before the separator, so chop it off
    const text = contents.slice(0, separatorIndex - 1);
    const json = contents.slice(separatorIndex + 4).trim();
    const result = parse(text, { mode: fileName.includes("jsonc") ? "jsonc" : "json" });
    fs.writeFileSync(filePath, text + "\n---\n" + JSON.stringify(result, null, "    "), "utf8");
});
