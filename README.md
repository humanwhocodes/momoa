# Momoa JSON

Momoa is a general purpose JSON utility toolkit, containing:

* A **tokenizer** that allows you to separate a JSON string into its component parts.
* A **parser** that produces an abstract syntax tree (AST) representing everything inside of a JSON string.
* A **traverser** that visits an AST produced by the parser in order.
* A **printer** that can convert an AST produced by the parser back into a valid JSON string.

## Introduction

JavaScript defines the `JSON` object with methods for both parsing strings into objects and converting objects into JSON-formatted strings. In most cases, this is exactly what you need and should use without question. However, these methods aren't useful for more fine-grained analysis of JSON structures. For instance, you'll never know if a JSON object contains two properties with the same names because `JSON.parse()` will ignore the first one and return the value of the second. A tool like Momoa comes in handy when you want to know not just the result of JSON parsing, but exactly what is contained in the original JSON string.

## Installation

You can install Momoa using npm or Yarn:

```bash
npm install @humanwhocodes/momoa --save

# or

yarn add @humanwhocodes/momoa
```

## Usage

### Parsing 

To parse a JSON string into an AST, use the `parse()` function:

```js
const { parse } = require("@humanwhocodes/momoa");

const ast = parse(some_json_string);
```

If you want the tokens from the parsing operation returns as a proprety of the AST root, pass a second argument:

```js
const { parse } = require("@humanwhocodes/momoa");

const ast = parse(some_json_string, { tokens: true });

// root now has a tokens array
console.dir(ast.tokens);
```

### Tokenizing 

To produce JSON tokens from a string, use the `tokens()` generator function:

```js
const { tokens } = require("@humanwhocodes/momoa");

for (const token of tokens(some_json_string)) {
    console.log(token.type);
    console.log(token.value);
}
```

The `tokens()` generator function returns an iterator that is suitable for use in a `for-of` loop.

If you want to retrieve an array of tokens, use the JavaScript spread operator:

```js
const { tokens } = require("@humanwhocodes/momoa");

const allTokens = [...tokens(some_json_string)];
```

### Traversing

TODO

### Printing

To convert an AST back into a JSON string, use the `print()` function:

```js
const { parse, print } = require("@humanwhocodes/momoa");

const ast = parse(some_json_string);
const text = print(ast);
```

**Note:** The printed AST will not produce the same result as the original JSON text as the AST does not preserve whitespace.

You can modify the output of the `print()` function by passing in an object with an `indent` option specifying the number of spaces to use for indentation. When the `indent` option is passed, the text produced will automatically have newlines insert after each `{`, `}`, `[`, `]`, and `,` characters.

```js
const { parse, print } = require("@humanwhocodes/momoa");

const ast = parse(some_json_string);
const text = print(ast, { indent: 4 });
```

## License

Apache 2.0

## Frequently Asked Questions

### What does "Momoa" even mean?

Momoa is the last name of American actor [Jason Momoa](https://en.wikipedia.org/wiki/Jason_Momoa). Because "JSON" is pronounced "Jason", I wanted a name that played off of this fact. The most obvious choice would have been something related to [Jason and the Argonauts](https://en.wikipedia.org/wiki/Jason_and_the_Argonauts_(1963_film)), as this movie is referenced in the [JSON specification](https://ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf) directly. However, both "Argo" and "Argonaut" were already used for open source projects. When I did a search for "Jason" online, Jason Momoa was the first result that came up. He always plays badass characters so it seemed to fit.