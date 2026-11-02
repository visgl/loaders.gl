# Dependency inventory

This snapshot was generated on November 2, 2026 from the non-private `modules/*` manifests and the `node_modules` tree of a clean checkout of loaders.gl `master` at commit `a168860`, after `yarn install --immutable`. It describes that development installation, not a guarantee about a published package or a consumer's dependency graph. Installations, platforms and versions can differ.

The script follows `dependencies` and `optionalDependencies` recursively, including dependencies of local loaders.gl modules. **Direct** counts named direct dependencies, including local modules. **External transitive only** counts distinct external package names reached through another dependency and not also directly declared by the module. **External total** is the union of direct and transitive external names actually resolved. Each count deduplicates names; the version inventory also distinguishes versions.

The snapshot has no unresolved dependency references. The script explicitly searches the installed npm packages even when a package name, such as `buffer` or `string_decoder`, is also a Node built-in. In the earlier development checkout, those names caused the previous resolver to skip the installed npm packages; they were not evidence of missing packages. These packages are not reachable in this snapshot's runtime dependency graph.

Peer requirements found in the traversed manifests are listed separately without resolving them or distinguishing optional peers. Peer dependencies, development dependencies, vendored code, browser CDN assets, runtime downloads and packages outside `modules/*` are excluded from the counts. As a result, the inventory is not a complete software bill of materials or a security assessment.

To regenerate from an installed checkout, run:

```bash
node scripts/security-dependency-inventory.cjs
```

Published modules: 21
Distinct external package names: 55
Distinct external name/version pairs: 56

| Module | Direct | External transitive only | External total |
| --- | ---: | ---: | ---: |
| `@loaders.gl/arcgis` | 5 | 40 | 41 |
| `@loaders.gl/archives` | 2 | 1 | 1 |
| `@loaders.gl/compression` | 1 | 0 | 1 |
| `@loaders.gl/core` | 7 | 10 | 17 |
| `@loaders.gl/crypto` | 0 | 0 | 0 |
| `@loaders.gl/documents` | 0 | 0 | 0 |
| `@loaders.gl/geospatial` | 5 | 14 | 17 |
| `@loaders.gl/graphs` | 2 | 5 | 6 |
| `@loaders.gl/images` | 2 | 0 | 2 |
| `@loaders.gl/ogc` | 5 | 8 | 10 |
| `@loaders.gl/pointclouds` | 4 | 17 | 21 |
| `@loaders.gl/raster` | 3 | 8 | 9 |
| `@loaders.gl/scene` | 5 | 0 | 4 |
| `@loaders.gl/scientific` | 6 | 14 | 19 |
| `@loaders.gl/services` | 0 | 0 | 0 |
| `@loaders.gl/splats` | 3 | 6 | 8 |
| `@loaders.gl/sql` | 1 | 5 | 6 |
| `@loaders.gl/tables` | 6 | 13 | 17 |
| `@loaders.gl/tiles` | 12 | 32 | 40 |
| `@loaders.gl/tiles-3d` | 12 | 24 | 31 |
| `@loaders.gl/traces` | 3 | 5 | 8 |

External package versions:

- `@bufbuild/protobuf@2.14.0`
- `@mapbox/martini@0.2.0`
- `@mapbox/point-geometry@1.1.0`
- `@maplibre/mlt@1.1.8`
- `@math.gl/core@5.0.0-beta.2`
- `@math.gl/dggs@5.0.0-beta.2`
- `@math.gl/earth@5.0.0-beta.2`
- `@math.gl/geometry@5.0.0-beta.2`
- `@math.gl/geospatial@5.0.0-beta.2`
- `@math.gl/web-mercator@5.0.0-beta.2`
- `@types/emscripten@1.41.5`
- `@types/geojson@7946.0.16`
- `@types/node@25.9.5`
- `@types/sql.js@1.4.9`
- `@zarrita/storage@0.2.0`
- `a5-js@0.10.1`
- `apache-arrow@21.2.0`
- `astronomy-engine@2.1.19`
- `compress-utils@0.12.0`
- `copc@0.0.8`
- `cross-fetch@3.2.0`
- `draco3d@1.5.7`
- `eventemitter3@5.0.4`
- `fflate@0.8.3`
- `flatbuffers@25.9.23`
- `h3-js@4.5.0`
- `h5wasm@0.10.3`
- `ieee754@1.2.1`
- `json-with-bigint@3.5.12`
- `laz-perf@0.0.7`
- `lerc@4.2.0`
- `node-fetch@2.7.0`
- `numcodecs@0.2.2`
- `numcodecs@0.3.2`
- `open-location-code@1.0.3`
- `p-queue@7.4.1`
- `p-timeout@5.1.0`
- `parquet-wasm@0.7.2`
- `pbf@3.3.0`
- `pmtiles@4.5.0`
- `polygon-clipping@0.15.7`
- `probe.gl@5.0.0`
- `protocol-buffers-schema@3.6.1`
- `reference-spec-reader@0.2.0`
- `resolve-protobuf-schema@2.1.0`
- `robust-predicates@3.0.3`
- `splaytree@3.2.3`
- `tr46@0.0.3`
- `tslib@2.8.1`
- `undici-types@7.24.6`
- `unzipit@2.0.0`
- `webidl-conversions@3.0.1`
- `whatwg-url@5.0.0`
- `zarr@0.5.2`
- `zarrita@0.7.5`
- `zod@4.6.5`

Peer requirements (not resolved or counted above):

- `@duckdb/duckdb-wasm@^1.33.1-dev45.0`
- `@duckdb/node-api@^1.5.2-r.1`
- `@loaders.gl/core@~5.0.0-alpha.0`
- `brotli@^1.3.2`
- `encoding@^0.1.0`
- `fzstd@0.1.1`
- `geotiff@^2.1.0`
- `hysnappy@^1.1.1`
- `lerc@^4.2.0`
- `lz4js@^0.2.0`
- `pako@^2.1.0`
- `sharp@^0.35.5`
- `snappyjs@^0.6.1`
- `sql.js@^1.14.1`
- `texture-compressor@^1.0.2`
- `zod@^4.1.12`
- `zstd-codec@^0.1`

Unresolved dependencies:

- None
