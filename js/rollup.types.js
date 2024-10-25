import dts from "rollup-plugin-dts";

// types that aren't exported by default by should be
const typeExports = [
    "ContainerNode",
    "LocationRange"
];

const footer = `export type { ${typeExports.join(", ")} };`;

export default [
    {
        input: "temp/momoa.d.ts",
        output: [
            {
                file: "dist/momoa.d.ts",
                format: "esm",
                footer
            }
        ],
        plugins: [
            dts()
        ]
    },
    {
        input: "temp/momoa.d.ts",
        output: [
            {
                file: "dist/momoa.d.cts",
                format: "commonjs",
                footer
            }
        ],
        plugins: [
            dts()
        ]
    }
];
