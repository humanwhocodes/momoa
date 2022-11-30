const {wasm} = require("@rollup/plugin-wasm");

module.exports = {
    input: 'src/index.js',
    output: {
        file: 'api.js',
        format: 'cjs'
    },
    plugins: [
        wasm({
            targetEnv: "auto-inline",
            maxFileSize: 0,
            sync: ["build/momoa_bg.wasm"]
        })]
};
