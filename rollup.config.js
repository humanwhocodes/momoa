import  { wasm } from "@rollup/plugin-wasm";

export default {
    input: 'src/index.js',
    output: {
        file: 'dist/momoa.js',
        format: 'esm'
    },
    plugins: [
        wasm({
            targetEnv: "auto-inline",
            maxFileSize: 0
        })]
};
