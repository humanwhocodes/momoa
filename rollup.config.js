const {wasm} = require("@rollup/plugin-wasm");

module.exports = {
    input: 'src/index.js',
    output: {
        file: 'api.js',
        format: 'cjs'
    },
    plugins: [wasm()]
};
