# Agent instructions

## Project overview

Momoa is a monorepo for JSON utilities in JavaScript and Rust. Both packages produce the same AST and should remain consistent in behavior and format.

- `js/` contains the JavaScript package, source, tests, and build tools.
- `rust/` contains the Rust crate, source, and tests.
- `fixtures/` contains shared test fixtures.
- `decisions/` records project design decisions.

Read the relevant package README before making package-specific changes.

## Setup and validation

Install the JavaScript dependencies from `js/` with `npm install`. Run `npm test` for the JavaScript test suite; it rebuilds the package and also checks TypeScript declarations. Run `npm run lint` for JavaScript linting. Use `npm run build` when a standalone build is needed.

From `rust/`, run `cargo test` for the Rust test suite; use `cargo build` to build the crate.

Run the checks for each package changed. Keep shared fixtures and the JavaScript and Rust behavior aligned when a change affects both implementations.

## Conventions and workflow

- Follow the existing style and patterns in the affected package.
- Add or update tests alongside behavior changes, using the existing package test structure and shared fixtures where applicable.
- Keep changes focused; do not edit generated build output unless the task specifically requires it.
- Use **Conventional Commits** for every commit message and pull request title: `type(scope): description`. Choose an appropriate type (such as `feat`, `fix`, `docs`, `test`, `refactor`, or `chore`); use an optional package scope such as `js` or `rust` when useful. Examples: `fix(js): handle escaped strings` and `docs: clarify parser options`.
