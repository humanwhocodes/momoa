# JSON5 Tokens and Nodes for Hexadecimal, NaN, Infinity

Date: 2024-07-09

Status: accepted

## Context

In JSON parsing mode, numbers are simply numeric strings optionally preceded by a minus sign. In JSON5, however, numbers can be in hexadecimal, have a leading plus sign, or be `NaN` or `Infinity`. Because the AST is designed to be JSON-serializable, this prevents using `Number` AST nodes to represent `NaN` and `Infinity` because those values are not valid JSON values.

## Decision

In JSON5 parsing mode:

* all of the number values will be represented by the `Number` token.
* only numeric values will be represented by the `Number` node.
* `Infinity`, `-Infinity`, and `+Infinity` will be represented by an `Infinity` node.
* `NaN`, `-NaN`, `+NaN`, will be represented by an `NaN` node.

## Consequences

Inside of Momoa, we will need to watch for `Infinity` and `NaN` being used as identifiers (keys in object properties), in which case a `Number` token that is exactly equal to `Infinity` or `NaN` are allowed.

For token consumers, this means they cannot assume that the substring representing the `Number` token is always numeric.

For AST consumers, this means they will need to check for `Number`, `Infinity`, and `NaN` nodes in locations where numbers are allowed.
