
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
// Main
//-----------------------------------------------------------------------------

const astsPath = "../fixtures/asts";
const astsWithRangePath = "../fixtures/asts-with-range";

fs.readdirSync(astsPath).forEach(fileName => {

    const filePath = path.join(astsPath, fileName);
    const contents = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
    const separatorIndex = contents.indexOf("---");

    // Note there is a \n before the separator, so chop it off
    const text = contents.slice(0, separatorIndex - 1);
    // const json = contents.slice(separatorIndex + 4).trim();

    let mode = "json";
    if (fileName.includes("jsonc")) {
        mode = "jsonc";
    } else if (fileName.includes("json5")) {
        mode = "json5";
    }

    // with ranges
    let result = parse(text, { mode, ranges: true, tokens: true });
    fs.writeFileSync(path.join(astsWithRangePath, fileName), text + "\n---\n" + JSON.stringify(result, null, "    "), "utf8");

    // without ranges
    result = parse(text, { mode, tokens: true });
    fs.writeFileSync(filePath, text + "\n---\n" + JSON.stringify(result, null, "    "), "utf8");
});
