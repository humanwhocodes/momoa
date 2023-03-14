import copy from "rollup-plugin-copy";
import dts from "rollup-plugin-dts";

export default [
    {
        input: "src/index.js",
        output: [
            {
                file: "dist/momoa.js",
                format: "esm"
            },
            {
                file: "dist/momoa.cjs",
                format: "commonjs"
            }
        ],
        plugins: [
            copy({
                targets: [
                    { src: "src/momoa.d.ts", dest: "temp/" }
                ]
            })
        ]
    },
    {
        input: "temp/index.d.ts",
        output: [
            {
                file: "dist/momoa.d.ts",
                format: "esm"
            }
        ],
        plugins: [
            dts()
        ]
    }
];
