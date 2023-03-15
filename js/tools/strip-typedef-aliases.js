
/**
 * @fileoverview Strips typedef aliases from the rolled-up file.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const filePath = "./dist/momoa.js";
const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/g);
const typedefs = new Set();

const remainingLines = lines.filter(line => {

    if (!line.startsWith("/** @typedef {import")) {
        return true;
    }

    if (typedefs.has(line)) {
        return false;
    }

    typedefs.add(line);
    return true;
});



fs.writeFileSync(filePath, remainingLines.join("\n"), "utf8");
