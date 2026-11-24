import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        rules: {
            indent: ["error", 4, { SwitchCase: 1 }],
            "linebreak-style": ["error", "unix"],
            "no-unused-private-class-members": "off",
            quotes: ["error", "double"],
            semi: ["error", "always"]
        }
    },
    {
        files: ["tests/*.js"],
        languageOptions: {
            globals: {
                ...globals.mocha,
                ...globals.node
            }
        }
    }
];
