# USDC decoder source

`usdc-parser.js` is adapted from THREE.js r187, commit/tag r187:
https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/usd/USDCParser.js

Copyright © 2010–2026 three.js authors; MIT terms are in THREE-LICENSE.
This renderer-free source has no imports or package dependencies. It remains
vendored JavaScript; the adjacent declaration and handwritten parse-usdc.ts
adapter define the checked TypeScript boundary. Existing libs build/coverage
policy applies to this vendored decoder; adapter code remains fully instrumented.

Local changes bound aggregate allocations, integer precision and seek offsets,
reject unsupported dictionaries/list operations/encoding cases, validate LZ4
copies, use null-prototype dictionaries and correct signed inline integers.
The adapter restricts crate versions, validates section bounds, and converts the
supported specifications into USDStage. Broader upstream behavior is not promised.
