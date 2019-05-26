/**
This is an ECMA-404 compliant JSON parser written in pure JS, with nice error
reporting. It's not super useful since it's ridiculously slow compared to
`JSON.parse()`, but I had fun writing it.

ISC License

Copyright (c) 2019 Ryan Grove <ryan@wonko.com>

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
*/

'use strict';

const CHAR_ESCAPES = new Map([
    ['"', '"'],
    ['\\', '\\'],
    ['/', '/'],
    ['b', '\b'],
    ['f', '\f'],
    ['n', '\n'],
    ['r', '\r'],
    ['t', '\t']
]);

const INSIGNIFICANT_WHITESPACE = new Set([
    ' ',
    '\t',
    '\n',
    '\r'
]);

module.exports = function parseJson(text) {
    text = String(text);

    const state = {
        char: text.charAt(0) || null,
        length: text.length,
        pos: 0,
        text,
        values: []
    };

    consumeWhitespace(state);

    if (!consumeValue(state)) {
        errorEOF(state);
    }

    consumeWhitespace(state);

    if (state.pos < state.length) {
        error(state, 'Unexpected token after end of JSON input');
    }

    return state.values[0];
};

function advance(state) {
    state.pos += 1;

    state.char = state.pos < state.length
        ? state.text.charAt(state.pos)
        : null;

    return state.char;
}

function advanceAndConsumeWhitespace(state) {
    do {
        advance(state);
    } while (INSIGNIFICANT_WHITESPACE.has(state.char));
}

function consumeArray(state) {
    if (state.char !== '[') {
        return false;
    }

    let array = [];
    state.values.push(array);

    do {
        advanceAndConsumeWhitespace(state);

        if (state.char === ']') {
            continue;
        }

        if (!consumeValue(state)) {
            errorUnexpectedToken(state);
        }

        array.push(state.values.pop());
        consumeWhitespace(state);
    } while (state.char === ',');

    if (state.char !== ']') {
        errorUnexpectedToken(state);
    }

    advanceAndConsumeWhitespace(state);
    return true;
}

function consumeFalse(state) {
    if (state.char !== 'f') {
        return false;
    }

    if (advance(state) === 'a'
        && advance(state) === 'l'
        && advance(state) === 's'
        && advance(state) === 'e') {

        state.values.push(false);
        advanceAndConsumeWhitespace(state);
        return true;
    }

    errorUnexpectedToken(state);
}

function consumeNull(state) {
    if (state.char !== 'n') {
        return false;
    }

    if (advance(state) === 'u'
        && advance(state) === 'l'
        && advance(state) === 'l') {

        state.values.push(null);
        advanceAndConsumeWhitespace(state);
        return true;
    }

    errorUnexpectedToken(state);
}

function consumeNumber(state) {
    let { char } = state;
    let numberChars = '';

    if (char === '-') {
        numberChars += char;
        char = advance(state);
    }

    if (char === '0') {
        numberChars += char;
        char = advance(state);

        if (isDecimalDigit(char)) {
            errorUnexpectedToken(state);
        }
    } else {
        if (char < '1' || char > '9') {
            errorUnexpectedToken(state);
        }

        do {
            numberChars += char;
            char = advance(state);
        } while (isDecimalDigit(char));
    }

    if (char === '.') {
        numberChars += char;
        char = advance(state);

        if (!isDecimalDigit(char)) {
            errorUnexpectedToken(state);
        }

        do {
            numberChars += char;
            char = advance(state);
        } while (isDecimalDigit(char));
    }

    if (char === 'e' || char === 'E') {
        numberChars += char;
        char = advance(state);

        if (char === '-' || char === '+') {
            numberChars += char;
            char = advance(state);

            if (!isDecimalDigit(char)) {
                errorUnexpectedToken(state);
            }

            do {
                numberChars += char;
                char = advance(state);
            } while (isDecimalDigit(char));
        }
    }

    state.values.push(parseFloat(numberChars, 10));
    consumeWhitespace(state);
    return true;
}

function consumeObject(state) {
    if (state.char !== '{') {
        return false;
    }

    let object = {};
    state.values.push(object);

    do {
        advanceAndConsumeWhitespace(state);

        if (!consumeString(state)) {
            errorUnexpectedToken(state);
        }

        let key = state.values.pop();

        consumeWhitespace(state);

        if (state.char !== ':') {
            errorUnexpectedToken(state);
        }

        advanceAndConsumeWhitespace(state);

        if (!consumeValue(state)) {
            errorUnexpectedToken(state);
        }

        let value = state.values.pop();
        object[key] = value;

        consumeWhitespace(state);
    } while (state.char === ',');

    if (state.char !== '}') {
        errorUnexpectedToken(state);
    }

    advanceAndConsumeWhitespace(state);
    return true;
}

function consumeString(state) {
    if (state.char !== '"') {
        return false;
    }

    let string = '';
    advance(state);

    while (state.char !== '"') {
        let { char } = state;

        if (char === '\\') {
            char = advance(state);

            if (char === 'u') {
                let charCode = 0;

                for (let i = 0; i < 4; ++i) {
                    let digit = parseInt(advance(state), 16);

                    if (isNaN(digit)) {
                        errorUnexpectedToken(state);
                    }

                    charCode = (charCode * 16) + digit;
                }

                char = String.fromCharCode(charCode);
            } else {
                char = CHAR_ESCAPES.get(char);

                if (char === undefined) {
                    errorUnexpectedToken(state);
                }
            }
        } else if (char === null) {
            errorEOF(state);
        } else if (char.charCodeAt(0) <= 0x1F) {
            errorUnexpectedToken(state);
        }

        string += char;
        advance(state);
    }

    state.values.push(string);
    advanceAndConsumeWhitespace(state);
    return true;
}

function consumeTrue(state) {
    if (state.char !== 't') {
        return false;
    }

    if (advance(state) === 'r'
        && advance(state) === 'u'
        && advance(state) === 'e') {

        state.values.push(true);
        advanceAndConsumeWhitespace(state);
        return true;
    }

    errorUnexpectedToken(state);
}

function consumeValue(state) {
    return consumeObject(state)
        || consumeArray(state)
        || consumeNull(state)
        || consumeString(state)
        || consumeTrue(state)
        || consumeFalse(state)
        || consumeNumber(state);
}

function consumeWhitespace(state) {
    let startPos = state.pos;

    while (INSIGNIFICANT_WHITESPACE.has(state.char)) {
        advance(state);
    }

    return state.pos > startPos;
}

function error(state, message) {
    let { pos, text } = state;
    let column = 1;
    let excerpt = '';
    let line = 1;

    // Find the line and column where the error occurred.
    for (let i = 0; i < pos; ++i) {
        let char = text[i];

        if (char === '\n') {
            column = 1;
            excerpt = '';
            line += 1;
        } else {
            column += 1;
            excerpt += char;
        }
    }

    let eol = text.indexOf('\n', pos);

    excerpt += eol === -1
        ? text.slice(pos)
        : text.slice(pos, eol);

    let excerptStart = 0;

    // Keep the excerpt below 50 chars, but always keep the error position in
    // view.
    if (excerpt.length > 50) {
        if (column < 40) {
            excerpt = excerpt.slice(0, 50);
        } else {
            excerptStart = column - 20;
            excerpt = excerpt.slice(excerptStart, column + 30);
        }
    }

    let err = new SyntaxError(
        `${message} (line ${line}, column ${column})\n`
        + `  ${excerpt}\n`
        + ' '.repeat(column - excerptStart + 1) + '^\n'
    );

    err.column = column;
    err.excerpt = excerpt;
    err.line = line;
    err.pos = pos;

    throw err;
}

function errorEOF(state) {
    error(state, 'Unexpected end of JSON input');
}

function errorUnexpectedToken(state) {
    error(state, 'Unexpected token in JSON');
}

function isDecimalDigit(char) {
    return char !== null && char >= '0' && char <= '9';
}
