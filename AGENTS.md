# AGENTS.md

## Setup commands

- Install deps: `yarn install`
- Check types: `yarn build`
- Check website build `cd website; yarn; yarn build`

## Before committing

- Run tests: `yarn test node`
- Format code: `yarn lint fix`
- Always `yarn lint fix` after making changes to ensure that prettier formatting is maintained.

## Code style

- TypeScript strict mode
- Single quotes, no semicolons
- Never abbreviate variables, always type out the full name in camelCase (variables, functions, fields), PascalCase (types), CAPITAL_CASE (constant)
- Prefer verbNoun structure for function and method names.
- We end JavaScript statements with semicolons. Do not remove semicolons.

## Notes

- Avoid importing node specific files unless in specific functions that are intentionally designed to handle both cases. For instance, `fetchFile` handles both browser and Node.js, so importing `fs` is almost never required.
