# Momoa JSON

by [Nicholas C. Zakas](https://humanwhocodes.com)

If you find this useful, please consider supporting my work with a [donation](https://humanwhocodes.com/donate).

## About

Momoa is a general purpose JSON utility toolkit, containing:

* A **tokenizer** that allows you to separate a JSON string into its component parts.
* A ECMA-404 compliant **parser** that produces an abstract syntax tree (AST) representing everything inside of a JSON string.

## Background

A tool like Momoa comes in handy when you want to know not just the result of JSON parsing, but exactly what is contained in the original JSON string.

## Usage

### Parsing 

There are two parsing methods: one for JSON and one for JSONC.

To parse a JSON string into an AST, use the `json::parse()` function:

```rs
use momoa::ast::*;
use momoa::json;

fn do_parse(code) -> Node {
    let ast = json::parse(code).unwrap();

    // do something with ast

    ast
}
```

To allow trailing commas in JSON, use the `json::parse_with_trailing_commas()` function:

```rs
use momoa::ast::*;
use momoa::json;

fn do_parse(code) -> Node {
    let ast = json::parse_with_trailing_commas(code).unwrap();

    // do something with ast

    ast
}
```

To parse a JSONC string into an AST, use the `jsonc::parse()` function:

```rs
use momoa::ast::*;
use momoa::jsonc;

fn do_parse(code) -> Node {
    let ast = jsonc::parse(code).unwrap();

    // do something with ast

    ast
}
```

To allow trailing commas in JSONC, use the `jsonc::parse_with_trailing_commas()` function:

```rs
use momoa::ast::*;
use momoa::jsonc;

fn do_parse(code) -> Node {
    let ast = jsonc::parse_with_trailing_commas(code).unwrap();

    // do something with ast

    ast
}
```

### Tokenizing 

To produce JSON tokens from a string, use the `json::tokenize()` function:

```rs
use momoa::*;

fn do_parse(code) -> Vec<Token> {
    let result = json::tokenize(code).unwrap();


    // do something with ast

    result
}
```

To produce JSON tokens from a string, use the `jsonc::tokenize()` function:

```rs
use momoa::*;

fn do_parse(code) -> Vec<Token> {
    let result = jsonc::tokenize(code).unwrap();


    // do something with ast

    result
}
```

## Development

To work on Momoa, you'll need:

* [Git](https://git-scm.com/)
* [Rust](https://rustup.rs)

Make sure both are installed by visiting the links and following the instructions to install.

Now you're ready to clone the repository:

```bash
git clone https://github.com/humanwhocodes/momoa.git
```

Then, enter the directory and install the dependencies:

```bash
cd momoa/rust
cargo build
```

After that, you can run the tests via:

```bash
cargo test
```

## License

Apache 2.0

## Frequently Asked Questions

### What does "Momoa" even mean?

Momoa is the last name of American actor [Jason Momoa](https://en.wikipedia.org/wiki/Jason_Momoa). Because "JSON" is pronounced "Jason", I wanted a name that played off of this fact. The most obvious choice would have been something related to [Jason and the Argonauts](https://en.wikipedia.org/wiki/Jason_and_the_Argonauts_(1963_film)), as this movie is referenced in the [JSON specification](https://ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf) directly. However, both "Argo" and "Argonaut" were already used for open source projects. When I did a search for "Jason" online, Jason Momoa was the first result that came up. He always plays badass characters so it seemed to fit.

### Why support comments in JSON?

There are a number of programs that allow C-style comments in JSON files, most notably, configuration files for [Visual Studio Code](https://code.visualstudio.com). As there seems to be a need for this functionality, I decided to add it out-of-the-box.
