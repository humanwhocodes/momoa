# JSON and JSONC Will Allow Trailing Commas via an Option

Date: 2024-10-15

Status: accepted

## Context

JSONC parsing was meant to be compatible with Microsoft's [JSONC parser](https://github.com/microsoft/node-jsonc-parser) and initially the JSONC parsing was simply JSON with JavaScript-style comments. It was [pointed out](https://github.com/humanwhocodes/momoa/issues/135) that files like `tsconfig.json` and `settings.json` actually allow dangling commas in addition to comments. Upon further investigation, the Microsoft JSONC parser defaults to [disallowing dangling commas](https://github.com/microsoft/node-jsonc-parser/blob/3c9b4203d663061d87d4d34dd0004690aef94db5/src/impl/parser.ts#L22) and is enabled as an exception of VS Code- and TypeScript-related files.

## Decision

Both JSON and JSONC parsing modes will have an `allowTrailingCommas` option that will default to `false`. This will allow users to determine whether they want to allow comments, trailing commas, or both.

## Consequences

For JSON and JSON5 users, there will be no immediate action necessary.

For JSONC users, they will need to update their options to allowing trailing commas when parsing VS Code- and TypeScript-related files.
