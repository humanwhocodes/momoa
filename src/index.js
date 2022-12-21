/**
 * @fileoverview File defining the interface of the package.
 * @author Nicholas C. Zakas
 */

export { types } from "./types.js";
export { traverse, iterator } from "./traversal.js";
export { evaluate } from "./evaluate.js";
export { print } from "./print.js";
console.time("async init");
/*
 * Annoying -- we need to async initialize the WebAssembly
 * module. Hopefully, someday this mess won't be necessary
 * but for now...
 */
import init, { tokenize_js } from "../build/momoa.js";
import wasm from "../build/momoa_bg.wasm";
await init(await wasm());
console.timeEnd("async init");

export {tokenize_js};
