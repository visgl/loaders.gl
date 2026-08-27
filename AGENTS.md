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

## Test philosophy

- Chromium is the canonical runtime for browser-capable behavior. Plain `*.spec.ts` files run in Chromium; use `*.browser.spec.ts` when the test specifically requires browser APIs, `*.cross.spec.ts` only for the small compatibility set that also runs in Node, and `*.node.spec.ts` only for genuine Node-only APIs or behavior.
- Keep required pull-request tests fast and hermetic. Put expensive exhaustive matrices, large-fixture parses, and long fuzz corpora in `*.slow.spec.ts` (or `*.node.slow.spec.ts`), and put live-service checks in `*.external.spec.ts`. Fast and slow-hermetic projects must not access the public network.
- Prefer high-signal behavior and boundary coverage over test count. Test an implementation exhaustively in its owning module, then keep only focused public-entrypoint or integration conformance in wrapper modules; do not duplicate the same fixture, call, and assertions across packages.
- Use the smallest deterministic fixture that exercises the behavior. Fixtures over 1 MiB require an audited exception in the fast suite. Keep one representative large end-to-end parse in the slow lane when scale itself is meaningful.
- Parse immutable fixture data once with `beforeAll` when multiple assertions inspect the same result. Tests that mutate a result must clone it or parse independently so state cannot leak between cases.
- Write every new test case, and every substantially revised test, with native Vitest syntax (`test`, `describe`, `test.each`, lifecycle hooks, mocks, and `expect`). Do not use Tape for new coverage or add Tape imports; the Tape allowlist may only shrink.
- Coverage is enforced per non-private published `modules/*` package across statements, lines, functions, and branches. Never lower a committed threshold or add an exclusion merely to make coverage pass; generated, vendored, declaration, or unreachable platform-specific exclusions require an adjacent reason.
- Run `yarn test-audit` after changing test structure or fixtures. Use `yarn test-profile <mode>` when adding costly coverage, and move any fast test file that remains above the documented performance budget into smaller fast cases plus an explicit slow case.

### Test-performance pitfalls

- More workers are not automatically faster. Four Chromium workers made this suite slower than one because parsing-heavy files contended for CPU and memory. Benchmark a worker-count change with at least three equivalent runs before changing the default.
- Do not put every package import into one sequential compatibility test. A single all-package import smoke became a 75-second bottleneck and also tried to import browser-only `@loaders.gl/video` in Node. Keep Node compatibility checks lightweight and let Chromium exercise real browser package behavior.
- Vitest setup files run once per isolated test file. A broad setup import is multiplied across the suite, so keep project setup minimal and import specialized polyfills or helpers only in the projects or tests that need them.
- When consolidating case modules behind one aggregator, exclude the original `*.spec.*` files from direct discovery; otherwise every case runs twice. The aggregator must preserve named registrations so failures still identify the original case.
- Moving or deleting a spec can leave a stale side-effect import in a legacy `test/index.ts`. Check package test entrypoints as well as Vitest discovery; a missing import may appear only when another package imports that test subpath.
- `yarn build` cleans package `dist` directories, including previously built worker bundles. Run `yarn build-workers` after the final build and before browser tests; otherwise worker URLs return Vite's HTML fallback and fail with `Unexpected token '<'`.
- A remote URL may be stored in a constant and evade a simple static `fetch('https://…')` scan. Keep the runtime outbound-network blocker enabled for hermetic projects in addition to the source audit.
- Splitting tests into shards does not reduce critical-path time if shards run sequentially in one CI job. Put shards in separate matrix jobs, give blob artifacts unique names, and merge all reports before evaluating test counts or coverage.
- Coverage from a browser shard, the reduced Node suite, or a moved slow case is incomplete on its own. Enforce thresholds only after merging all browser shards, Node coverage, and coverage from the hermetic slow tests selected for the change. Keep a browser-only ratchet so Node or slow coverage cannot hide a browser regression.
- Vitest 4 removed `coverage.all`; explicit `coverage.include` is what keeps unexecuted production files in the denominator. Do not reintroduce obsolete settings when tuning coverage.
- File size is only a proxy for cost. For example, a moderately sized LAZ fixture can expand to hundreds of thousands of points and dominate runtime. Use profile results and decoded record counts in addition to bytes when deciding whether a case belongs in the slow lane.
- Runtime `if (isBrowser)` returns still pay file discovery, setup, and import costs. Prefer project/file naming (`.node`, `.cross`, `.slow`, `.external`) so the wrong runtime never collects the file.

## GitHub

- If `gh` authentication fails, check whether the authenticated GitHub plugin is available before treating GitHub access as blocked.
- When opening a pull request, verify that its description renders as properly formatted Markdown with real newlines, headings, and lists; do not submit a description with escaped or flattened newlines.
- After opening a pull request, wait 15 minutes, then review and resolve any outstanding review comments, and verify that coverage and all CI checks are green. Continue addressing newly posted review comments and rechecking the checks until the pull request is ready.

## Ready for merge

- Add or update TSDoc for every new class, function, method, and field.
- Update docs when behavior, public API, examples, or migration guidance changed.
- Make sure `yarn.lock` is up to date by running `yarn` in the repo root.
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
- Prefer `readonly` fields over getters for fixed or constructor-derived values.
- We end JavaScript statements with semicolons. Do not remove semicolons.

## Notes

- Published loaders.gl modules must not import `@loaders.gl/core` from `src/**`. `@loaders.gl/deck-layers` is the exception and may depend on `@loaders.gl/core`.
- If a published module needs functionality that currently lives in `@loaders.gl/core`, move the shared helper to a lower-level module or inject the dependency instead of adding a new `@loaders.gl/core` import.
- Avoid importing node specific files unless in specific functions that are intentionally designed to handle both cases. For instance, `fetchFile` handles both browser and Node.js, so importing `fs` is almost never required.
- In `package.json` `browser` fields, use relative replacements that match actual emitted files in the current layout: pair `./src/...*.ts` entries with the corresponding `./dist/...*.js` entries, and map each one either to a real browser shim file or to `false`. Do not leave stale paths such as old `dist/esm` targets or entries for files that do not exist in that module.
- Keep the upgrade guide focused on deleted or deprecated functionality. New feature documentation belongs in the module docs and release notes instead.
- Running module- or file-scoped commands such as `tsc` tends to generate `.js` and `.d.ts` files in this repo. After such commands, check for generated files and remove them before finishing.
- Running tests that use workers requires `yarn build` first so the worker bundles exist before the tests run.
- `@loaders.gl/gis` should expose the minimal helper set loaders need to create returned geometries, in particular `geoarrow.wkb` geometry columns.
- `@loaders.gl/geoarrow` should provide the richer converter and processing APIs for geospatial tables, especially GeoArrow-formatted Arrow tables.
- Loaders should not import the larger `@loaders.gl/geoarrow` module; applications can install and use it when they need more extensive geospatial processing.

## Loader module structure

- Use `modules/csv` as the reference shape for loader modules that want a lightweight root import and an implementation subpath.
- The package root `src/index.ts` should export metadata-only loaders, deprecated `*WorkerLoader` aliases if needed for compatibility, writers, and shared public types/options. It should not export `*WithParser` loaders.
- Each public metadata loader should live in its own `*-loader-types.ts` file. That file should contain the loader metadata, options, default values, and an optional `preload()` function, but no `parse`, `parseSync`, `parseText`, or `parseInBatches` methods.
- `preload()` should use a static package-subpath import such as `await import('@loaders.gl/csv/csv-loader')`, and return the parser-bearing loader export. Prefer static package imports over relative paths or computed import specifiers.
- Each parser-bearing loader should live in its own `*-loader.ts` file and export only the `*WithParser` loader. Keep parser logic out of the metadata file.
- Move shared constants, option defaults, and types needed by both metadata and parser files into neutral shared files to avoid cycles.
- Keep writer entry points unchanged unless the package is intentionally splitting them as well.
- In `package.json`, keep explicit subpath exports for parser entry points such as `./csv-loader` and `./csv-arrow-loader`. Root exports stay metadata-only; direct parser access happens through the subpath.
- Core async APIs may accept metadata loaders and upgrade them through `preload()`. Sync parsing paths should continue to require a parser-bearing loader.
