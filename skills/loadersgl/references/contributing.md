# Repository contribution

Read `AGENTS.md` and scoped instructions. Use native Vitest for new coverage;
keep fast tests deterministic, hermetic and small. Put costly parses in the slow
lane and live-service checks in external tests. Test behavior in its owning module.
Do not lower coverage thresholds to make a change pass.

Use the exact scripts in package.json: `yarn`, `yarn build`, `yarn build-workers`,
`yarn test-node`, `yarn test-headless`, and `yarn lint fix`. Run `yarn test-audit`
when changing test structure or fixtures. Build the website with `cd website`,
`yarn`, then `yarn build` when documentation or website configuration changes.

Document new public symbols with TSDoc and update module docs for API changes.
Check for stray generated files after scoped TypeScript commands. Follow the
repository's current PR review and CI requirements; merge only when asked.
