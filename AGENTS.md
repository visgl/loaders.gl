# AGENTS.md

## Setup commands

- Install deps: `yarn install`
- Check types: `yarn build`
- Check website build `cd website; yarn; yarn build`

## Before committing

- Run Node tests: `yarn test-node`
- Run headless browser tests: `yarn test-headless`
- Format code: `yarn lint fix`
- Always run `yarn lint fix` after making changes to ensure that Biome formatting is maintained.
- Use the exact script names from `package.json`; do not substitute spaced forms such as `yarn test node` or `yarn test headless`.

## Ready for merge

- Add or update TSDoc for every new class, function, method, and field.
- Update docs when behavior, public API, examples, or migration guidance changed.
- Run build: `yarn build`
- Run Node tests: `yarn test-node`
- Run headless browser tests: `yarn test-headless`
- Format code: `yarn lint fix`
- Provide a copyable markdown PR description, compared to `master`, that starts with goals of the PR and then lists actual changes.

## Code style

- TypeScript strict mode
- Single quotes, no semicolons
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Add TSDoc to all new classes, functions, methods, fields.
- Prefer verbNoun structure for function and method names.
- We end JavaScript statements with semicolons. Do not remove semicolons.

## Notes

- Published loaders.gl modules must not import `@loaders.gl/core` from `src/**`. `@loaders.gl/deck-layers` is the exception and may depend on `@loaders.gl/core`.
- If a published module needs functionality that currently lives in `@loaders.gl/core`, move the shared helper to a lower-level module or inject the dependency instead of adding a new `@loaders.gl/core` import.
- Avoid importing node specific files unless in specific functions that are intentionally designed to handle both cases. For instance, `fetchFile` handles both browser and Node.js, so importing `fs` is almost never required.
- Default new tests to shared `*.spec.ts` coverage so they run in both Node and headless browser projects. Use `*.node.spec.ts` only when the test genuinely depends on Node-only behavior or APIs.
- In `package.json` `browser` fields, use relative replacements that match actual emitted files in the current layout: pair `./src/...*.ts` entries with the corresponding `./dist/...*.js` entries, and map each one either to a real browser shim file or to `false`. Do not leave stale paths such as old `dist/esm` targets or entries for files that do not exist in that module.
- Keep the upgrade guide focused on deleted or deprecated functionality. New feature documentation belongs in the module docs and release notes instead.
- Running module- or file-scoped commands such as `tsc` tends to generate `.js` and `.d.ts` files in this repo. After such commands, check for generated files and remove them before finishing.
- Running tests that use workers requires `yarn build` first so the worker bundles exist before the tests run.
