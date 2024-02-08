/**
 * @fileoverview Tests that node16 moduleResolution imports succeed.
 */
/* eslint-disable no-console */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_FIXTURE_DIR = path.join(__dirname, "fixtures");
const FIXTURE_DIRS = [
    path.join(BASE_FIXTURE_DIR, "ts-project-module-node16-cjs"),
    path.join(BASE_FIXTURE_DIR, "ts-project-module-node16-esm"),
];

try {
    for (const dir of FIXTURE_DIRS) {
        execSync("npm i", {cwd: dir});
        console.log(`${path.relative(__dirname, dir)}: success`);
    }
    console.log("node16 type loading: success");
} catch (err) {
    const error =
    /** @type {Error & import('child_process').SpawnSyncReturns<string>} */ (
            err
        );
    console.error(error.stdout);
    console.error(error.stderr);
    process.exit(1);
}
