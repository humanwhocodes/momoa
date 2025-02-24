/**
 * @fileoverview Tests of TypeScript types.
 * @author Nicholas C. Zakas
 */

import {
    parse,
    tokenize,
    print,
    traverse,
    iterator,
    evaluate
} from "@humanwhocodes/momoa";

parse("foo");
parse("foo", {});
parse("foo", { ranges: true });
parse("foo", { tokens: true });
parse("foo", { mode: "json" });
parse("foo", { mode: "jsonc" });
parse("foo", { mode: "json5" });
parse("foo", { ranges: true, tokens: true, allowTrailingCommas: true, mode: "jsonc" });

tokenize("foo");
tokenize("foo", {});
tokenize("foo", { ranges: true });
tokenize("foo", { mode: "json" });
tokenize("foo", { mode: "jsonc" });
tokenize("foo", { mode: "json5" });
tokenize("foo", { ranges: true, mode: "jsonc" });

const node = parse("foo");
print(node);
print(node, {});
print(node, { indent: 2 });

const ast = parse("foo");

traverse(ast, {
    enter(node) {
        console.log("Entering node:", node.type);
    },
    exit(node) {
        console.log("Leaving node:", node.type);
    }
});

const iter = iterator(ast);

for (const { node, phase, parent } of iter) {
    console.log("Iterating node:", node.type);
    console.log("Iterating phase:", phase);
    console.log("Iterating parent:", parent?.type);
}

evaluate(ast);
