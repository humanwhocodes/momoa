export default [
    {
        input: 'src/index.js',
        output: [
            {
                file: 'dist/momoa.js',
                format: 'esm'
            },
            {
                file: 'dist/momoa.cjs',
                format: 'commonjs'
            }
        ]
    }
];
