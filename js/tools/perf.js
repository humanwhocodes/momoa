/**
 * @fileoverview Performance tests
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import Benchmark from "benchmark";
import benchmarks from "beautify-benchmark";
import fs from "node:fs";
import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import parse2 from "json-to-ast";
import parse3 from "./json-parse.cjs";
// const parse2 = require("json-to-ast");
// const parse3 = require("./json-parse.js");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const vuePkgLock = fs.readFileSync("../fixtures/big/vue-package-lock.json", "utf8");

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

const suite = new Benchmark.Suite();

// add tests
suite
.add("Momoa JS", () => {
    momoa_cjs.parse(vuePkgLock);
})
.add("Momoa WASM", () => {
    momoa_esm.parse(vuePkgLock);
})
.add("json-to-ast", () => {
    parse2(vuePkgLock);
})
.add("parseJson.js", () => {
    parse3(vuePkgLock);
})
.on("cycle", (event) => {
    benchmarks.add(event.target);
})
.on("complete", () => {
    benchmarks.log();
})
.run({ 'async': true });


// suite
//     .add("tokens()", () => {
//         const result = [...tokens(vuePkgLock)];
//     })
//     .add("tokenize()", () => {
//         const result = tokenize(vuePkgLock);
//     })
//     .on("cycle", (event) => {
//         benchmarks.add(event.target);
//     })
//     .on("complete", () => {
//         benchmarks.log();
//     })
//     .run({ 'async': true });
