# Changelog

## [3.3.10](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.9...momoa-js-v3.3.10) (2025-10-20)


### Bug Fixes

* add missing `LocationRange` type export ([#197](https://github.com/humanwhocodes/momoa/issues/197)) ([9228a78](https://github.com/humanwhocodes/momoa/commit/9228a78c64bd84988888da9d5a0dc9f8a885e687))

## [3.3.9](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.8...momoa-js-v3.3.9) (2025-07-29)


### Bug Fixes

* document start/end inconsistency to include trailing whitespace ([#191](https://github.com/humanwhocodes/momoa/issues/191)) ([aaa77ed](https://github.com/humanwhocodes/momoa/commit/aaa77ed10e3e27c6d051ac6cde066dfd9cdb166e))

## [3.3.8](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.7...momoa-js-v3.3.8) (2025-02-24)


### Bug Fixes

* CommonJS types compatibility ([#179](https://github.com/humanwhocodes/momoa/issues/179)) ([2c77876](https://github.com/humanwhocodes/momoa/commit/2c77876ae452e75ec35d1120f25baabdf6fc8194))

## [3.3.7](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.6...momoa-js-v3.3.7) (2025-02-21)


### Bug Fixes

* Simplify types for better TypeScript compatibility ([#176](https://github.com/humanwhocodes/momoa/issues/176)) ([8a2f689](https://github.com/humanwhocodes/momoa/commit/8a2f6898ddd2f619a676af0882e64a20da1e22b0))

## [3.3.6](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.5...momoa-js-v3.3.6) (2025-01-07)


### Bug Fixes

* Types for optional arguments in parse() and tokenize() ([11a4a40](https://github.com/humanwhocodes/momoa/commit/11a4a403c655e13284597abc2e540c733f27ddeb)), closes [#172](https://github.com/humanwhocodes/momoa/issues/172)

## [3.3.5](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.4...momoa-js-v3.3.5) (2024-12-05)


### Bug Fixes

* Interpreting unicode escape sequences in IDs allow uppercase ([ef50a89](https://github.com/humanwhocodes/momoa/commit/ef50a897908ef1b8673f7a298646f356043529ba))
* Validate identifiers with unicode escapes ([d758179](https://github.com/humanwhocodes/momoa/commit/d75817970daf5149973f227d5dc1d6c351dc1c99))

## [3.3.4](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.3...momoa-js-v3.3.4) (2024-12-03)


### Bug Fixes

* Unescape JSON5 identifier values ([#165](https://github.com/humanwhocodes/momoa/issues/165)) ([5633bc4](https://github.com/humanwhocodes/momoa/commit/5633bc4b9db0becd5bb935c33fec3ad221308032)), closes [#164](https://github.com/humanwhocodes/momoa/issues/164)

## [3.3.3](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.2...momoa-js-v3.3.3) (2024-11-06)


### Bug Fixes

* Ensure numeric property keys are a syntax error ([#156](https://github.com/humanwhocodes/momoa/issues/156)) ([8c6b9c3](https://github.com/humanwhocodes/momoa/commit/8c6b9c33758af7137c43f7784c212364951e2528)), closes [#154](https://github.com/humanwhocodes/momoa/issues/154)

## [3.3.2](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.1...momoa-js-v3.3.2) (2024-11-05)


### Bug Fixes

* Correctly convert -0x1 to a number ([c77a96e](https://github.com/humanwhocodes/momoa/commit/c77a96eaa149bf1350615352252e4c1bfcf6d3d5)), closes [#151](https://github.com/humanwhocodes/momoa/issues/151)
* mark `allowTrailingCommas` as optional ([#150](https://github.com/humanwhocodes/momoa/issues/150)) ([5746823](https://github.com/humanwhocodes/momoa/commit/574682317c14e457bc0a1830003567bf96809c55))

## [3.3.1](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.3.0...momoa-js-v3.3.1) (2024-10-28)


### Bug Fixes

* **types:** Export LocationRange and ContainerNode ([#145](https://github.com/humanwhocodes/momoa/issues/145)) ([4f569d7](https://github.com/humanwhocodes/momoa/commit/4f569d7a7f69e3e43c8c98f29c81966cc7f9d436))

## [3.3.0](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.2.2...momoa-js-v3.3.0) (2024-10-15)


### Features

* Add option to allow trailing commas in JSON and JSONC ([#136](https://github.com/humanwhocodes/momoa/issues/136)) ([76e23f4](https://github.com/humanwhocodes/momoa/commit/76e23f4cc21f8cae346b06ea8408fda260f80f5a)), closes [#135](https://github.com/humanwhocodes/momoa/issues/135)

## [3.2.2](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.2.1...momoa-js-v3.2.2) (2024-10-04)


### Bug Fixes

* Incremental lexing ([#132](https://github.com/humanwhocodes/momoa/issues/132)) ([cbf2cae](https://github.com/humanwhocodes/momoa/commit/cbf2cae4a54f7232c36ab341ec7064c1f709182d))

## [3.2.1](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.2.0...momoa-js-v3.2.1) (2024-09-06)


### Bug Fixes

* **types:** fix FilterPredicate type ([#123](https://github.com/humanwhocodes/momoa/issues/123)) ([f082d92](https://github.com/humanwhocodes/momoa/commit/f082d92a8257c7d95897b94c34487f44f20a2fe3))

## [3.2.0](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.1.1...momoa-js-v3.2.0) (2024-07-22)


### Features

* JSON5 support to JS API ([#109](https://github.com/humanwhocodes/momoa/issues/109)) ([d9af65b](https://github.com/humanwhocodes/momoa/commit/d9af65bd3c93767aac4d60acaf86286fc7e034fd))

## [3.1.1](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.1.0...momoa-js-v3.1.1) (2024-07-03)


### Bug Fixes

* **docs:** Add visitorKeys ([8aae932](https://github.com/humanwhocodes/momoa/commit/8aae9321ad88c170da6e221fc7dc65c50c79def3))

## [3.1.0](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.6...momoa-js-v3.1.0) (2024-07-03)


### Features

* Export visitorKeys ([6280a40](https://github.com/humanwhocodes/momoa/commit/6280a4085f05655eb9ccae0645014b4c6f7d4d63))

## [3.0.6](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.5...momoa-js-v3.0.6) (2024-06-21)


### Bug Fixes

* More type errors ([d5689f3](https://github.com/humanwhocodes/momoa/commit/d5689f31243b3c285c226463bc81dfa5f5a983ff))

## [3.0.5](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.4...momoa-js-v3.0.5) (2024-06-21)


### Bug Fixes

* Type errors ([d17b643](https://github.com/humanwhocodes/momoa/commit/d17b64341033aeaa4cf2c90a2a292714c0c27f09))

## [3.0.4](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.3...momoa-js-v3.0.4) (2024-06-21)


### Bug Fixes

* **types:** Node#loc is not optional ([1982367](https://github.com/humanwhocodes/momoa/commit/1982367cf12df54857a21e52cd5e27fb755aee58))

## [3.0.3](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.2...momoa-js-v3.0.3) (2024-06-19)


### Bug Fixes

* Parsing of incomplete object should throw unexpected EOF error ([b661d79](https://github.com/humanwhocodes/momoa/commit/b661d79b19ba1b36e952fbc80f378ec8d2bfdd44))
* Type definitions ([9c41c91](https://github.com/humanwhocodes/momoa/commit/9c41c917b9091a8d1cab7835c21fbf98b0c1b065))

## [3.0.2](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.1...momoa-js-v3.0.2) (2024-04-18)


### Bug Fixes

* **docs:** Update incorrect example ([6c2b9ba](https://github.com/humanwhocodes/momoa/commit/6c2b9ba49b82b61e6150d71d37af13c442a4aed6))

## [3.0.1](https://github.com/humanwhocodes/momoa/compare/momoa-js-v3.0.0...momoa-js-v3.0.1) (2024-02-12)


### Bug Fixes

* **types:** Ensure proper types in Momoa JS ([4ffe83b](https://github.com/humanwhocodes/momoa/commit/4ffe83bed82e7595f23434a4f2a647d6ff0ec3f8))

## [3.0.0](https://github.com/humanwhocodes/momoa/compare/momoa-js-v2.0.4...momoa-js-v3.0.0) (2023-03-15)


### Features

* **momoa-js:** Add type checking ([#64](https://github.com/humanwhocodes/momoa/issues/64)) ([9dec1c7](https://github.com/humanwhocodes/momoa/commit/9dec1c79810cacd08d407705b9270100dae1fd0b))
* Re-add the ranges option ([7ce69ee](https://github.com/humanwhocodes/momoa/commit/7ce69ee09193ded612f5d5522be6fc950230f516))
* Re-add tokens option for parse ([808a21e](https://github.com/humanwhocodes/momoa/commit/808a21e2a49f8982d47245b934b861e15dbb6d91))

### [2.0.4](https://www.github.com/humanwhocodes/momoa/compare/v2.0.3...v2.0.4) (2022-04-18)


### Bug Fixes

* Ensure invalid exponent numbers throw an error ([332197c](https://www.github.com/humanwhocodes/momoa/commit/332197cf61c4fae58b8a077c7268670cbca2d212)), closes [#21](https://www.github.com/humanwhocodes/momoa/issues/21)
