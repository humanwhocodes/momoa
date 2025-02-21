import copy from "rollup-plugin-copy";

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
                    { src: "src/typedefs.ts", dest: "dist/" },
                ]
            })
        ]
    }
];
