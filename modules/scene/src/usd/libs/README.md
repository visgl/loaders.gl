# USDC decoder source

`usdc-parser.js` is adapted from THREE.js r187, commit/tag r187:
https://github.com/mrdoob/three.js/blob/r187/examples/jsm/loaders/usd/USDCParser.js

Copyright © 2010–2026 three.js authors; MIT terms are in THREE-LICENSE.
This renderer-free source has no imports or package dependencies. It remains
vendored JavaScript; the adjacent declaration and handwritten parse-usdc.ts
adapter define the checked TypeScript boundary. Existing libs build/coverage
policy applies to this vendored decoder; adapter code remains fully instrumented.

Local changes bound aggregate allocations, integer precision and seek offsets,
support bounded dictionary values and reject unsupported list operations/encoding cases, validate LZ4
copies, use null-prototype dictionaries and correct signed inline integers.
The adapter restricts crate versions, validates section bounds, and converts the
supported specifications into USDStage. Broader upstream behavior is not promised.

Dictionary decoding uses string-table keys and forward offsets to complete value
representations, retaining false, empty strings, empty dictionaries and asset paths.
It rejects duplicate/invalid keys, cycles, nesting beyond 64, and unsupported
complex dictionary value types. These checks extend the r187 source while
preserving its MIT attribution; no THREE runtime is imported.

The authored-value extension decodes inline half and signed/unsigned 64-bit scalars,
string arrays, and compressed half/double arrays. Dictionary array support is an
explicit allowlist; unsupported representations fail before payload decoding.
Half integer compression uses ties-to-even rounding, and lookup indices are checked.
