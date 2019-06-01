/**
 * @fileoverview Performance tests
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

const Benchmark = require("benchmark");
const benchmarks = require("beautify-benchmark");
const { parse, tokens, tokenize } = require("../");
const parse2 = require("json-to-ast");
const parse3 = require("./json-parse.js");
const fs = require("fs");

//-----------------------------------------------------------------------------
// Data
//-----------------------------------------------------------------------------

const vuePkgLock = fs.readFileSync("./tests/fixtures/big/vue-package-lock.json", "utf8");

//-----------------------------------------------------------------------------
// Tests
//-----------------------------------------------------------------------------

const suite = new Benchmark.Suite();

// add tests
suite
.add("Momoa", () => {
    const result = parse(vuePkgLock);
})
.add("json-to-ast", () => {
    const result = parse2(vuePkgLock);
})
.add("parseJson.js", () => {
    const result = parse3(vuePkgLock);
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