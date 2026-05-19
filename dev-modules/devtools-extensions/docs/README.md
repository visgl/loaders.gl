# devtools-extensions

`devtools-extensions` holds repo-owned reusable development helpers that can be upstreamed into `@vis.gl/dev-tools`.

Current support:
- Biome base config and root lint wrapper used by `yarn lint` / `yarn lint fix`
- Benchmark resolver used by `yarn test bench`, including source-first workspace resolution and TypeScript transpilation so Node benchmarks do not require prebuilt `dist`
- Browser benchmark runner used by `yarn test bench-browser` / `yarn test bench-headless`

Boundary:
- Reusable defaults and helper code live in `dev-modules/devtools-extensions`
- Repo-specific policy stays in `.ocularrc.js` and `biome.jsonc`
