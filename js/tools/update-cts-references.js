
/**
 * @fileoverview Updates types.js references to types.cjs in the rolled-up
 * .d.ts file.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import fs from "node:fs";

//-----------------------------------------------------------------------------
// Main
//-----------------------------------------------------------------------------

const filePath = "./dist/momoa.d.cts";
const code = fs.readFileSync(filePath, "utf8");
const fixedCode = code.replace(/typedefs\.js/g, "typedefs.cjs");

fs.writeFileSync(filePath, fixedCode, "utf8");
