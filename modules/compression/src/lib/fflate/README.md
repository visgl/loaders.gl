# Internal fflate engine

Source: https://github.com/101arrowz/fflate/blob/v0.7.4/src/index.ts
Version: 0.7.4 (MIT; see LICENSE).
Upstream tag revision: `0f439ed3293b1da1f439fbbc5125b1097b75d3ac`.

This fork retains the synchronous raw DEFLATE, zlib and gzip functions and their
stream classes. Worker-based asynchronous APIs, ZIP, and text utilities were
removed: loaders.gl owns its worker and async adapters. Codec algorithms are
unchanged. Upstream names and documentation are retained for source comparison;
strict TypeScript compatibility changes are recorded below.

The npm package remains a development dependency solely as a parity and benchmark
reference. Production compression imports use this internal engine.

Compatibility changes: native ES2022 inheritance replaces ES5 constructor/prototype
calls; inherited fields use `declare` so subclass initialization does not erase
base state. Non-null assertions express upstream state invariants under strict
TypeScript. Boolean byte-count expressions become equivalent numeric ternaries.
Biome formatting and narrow lint annotations preserve upstream coercion and
assignment expressions. No compression tuning is included in this tranche.
