/**
 * @fileoverview Performance tests
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import Benchmark from "benchmark";
import benchmarks from "beautify-benchmark";
import * as momoa_esm from "../dist/momoa.js";
import momoa_cjs from "../dist/momoa.cjs";
import fs from "fs";

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
    .add("tokenize JS", () => {
        const result = momoa_cjs.tokenize(vuePkgLock);
    })
    .add("tokenize WASM", () => {
        const result = momoa_esm.tokenize(vuePkgLock);
    })
    .on("cycle", (event) => {
        benchmarks.add(event.target);
    })
    .on("complete", function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        benchmarks.log();
    })
    .run({ 'async': true });
