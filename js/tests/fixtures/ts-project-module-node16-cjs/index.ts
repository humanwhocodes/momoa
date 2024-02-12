import { parse } from "@humanwhocodes/momoa";

const ast = parse(`{ "a": 1 }`)
console.log(ast);
