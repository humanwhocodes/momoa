/**
 * @fileoverview Performance tests
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import Benchmark from "benchmark";
import benchmarks from "beautify-benchmark";
import { tokenize, tokenize_js } from "../dist/momoa.js";
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
    .add("tokenize", () => {
        const result = tokenize(vuePkgLock);
    })
    .add("tokenize_js", () => {
        const result = tokenize_js(vuePkgLock);
    })
    .on("cycle", (event) => {
        benchmarks.add(event.target);
    })
    .on("complete", function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));
        benchmarks.log();
    })
    .run({ 'async': true });
