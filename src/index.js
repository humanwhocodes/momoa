/**
 * @fileoverview File defining the interface of the package.
 * @author Nicholas C. Zakas
 */

export { tokenize } from "./tokens.js";
export { parse } from "./parse.js";
export { types } from "./types.js";
export { traverse, iterator } from "./traversal.js";
export { evaluate } from "./evaluate.js";
export { print } from "./print.js";


import { initSync, tokenize_js } from "../build/momoa.js";
import wasm from "../build/momoa_bg.wasm";
initSync(wasm());
export {tokenize_js};
