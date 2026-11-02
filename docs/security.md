# Security

loaders.gl helps applications work with a wide range of data formats across browsers and servers. Security is part of making that data useful: understanding where data and code come from, choosing appropriate resource limits, and keeping dependencies and releases trustworthy all help applications load and process data with confidence.

This page describes the main attack vectors and practical ways to address them. Applications have different trust boundaries and resource needs, so choose controls that fit the loaders, runtime and deployment you use.

## Reporting a vulnerability

Report suspected vulnerabilities privately through [GitHub security advisories](https://github.com/visgl/loaders.gl/security/advisories/new), rather than opening a public issue. See the [security policy](https://github.com/visgl/loaders.gl/blob/master/.github/SECURITY.md) for supported versions and disclosure timing.

## Attack vectors

The sections below describe ways an attacker could target an application through data, requests, dependencies, or executable code, and the controls that can help reduce exposure.

### Loading data and external resources

A URL or file reference can lead to unexpected network requests or access to local files. Some formats reference additional assets, and a loader may follow those references. In server-side applications, attacker-controlled URLs can also reach internal services or other destinations the application can access.

- Restrict permitted schemes, hosts, ports and local paths, including those reached through redirects and referenced assets. Enforce the same policy at the network or filesystem boundary; validating only the original URL is insufficient.
- Keep credentials scoped to the intended service. Avoid forwarding authorization headers to unrelated origins or logging tokens and signed URLs. See [authentication](developer-guide/authentication.md).
- Set application-appropriate limits on response bytes, request count, concurrency and time. Do not rely solely on a declared content length.
- Browser same-origin rules, CORS and content security policy can help constrain requests, but they do not replace server-side access controls.

### Parsing and resource exhaustion

A malformed or deliberately complex file can consume excessive CPU or memory, trigger parser errors, or exploit a defect in a decoder. File extensions and media types are not proof that data is safe. Validate inputs against the formats and sizes your application expects, handle parsing errors, and budget for decoded geometry, images and tables as well as their input bytes.

For hostile inputs, use process or container isolation and enforce memory and execution-time limits outside the parser. Web Workers can keep work off the UI thread, but a worker alone is not a security boundary or a guarantee of bounded memory. Render or display parsed content as data: apply the appropriate escaping and sanitization before inserting untrusted text or markup into a page.

### Decompression and archives

Compressed data can expand dramatically, and nested archives or large numbers of entries can amplify CPU, memory and storage use. A small compressed input is not evidence that its decoded output is small. Apply limits to compressed and expanded bytes, aggregate output across entries and nested archives, nesting depth, entry count and processing time. If writing archive entries to disk, validate normalized paths and reject traversal and unsafe links.

The [compress-utils untrusted input guidance](https://github.com/dupontcyborg/compress-utils#untrusted-input) explains output, decoder-memory and streaming limits. Its [JavaScript documentation](https://github.com/dupontcyborg/compress-utils/blob/main/bindings/wasm/README.md#errors-and-limits) distinguishes one-shot limits from stream limits. Those protections apply to the specific compress-utils APIs and versions being used; loaders.gl can use other codecs and does not guarantee a universal decompression limit. Confirm that the limits are actually exposed and enforced on your chosen path, and use application or process-level limits where they are not.

### Dependencies and the software supply chain

Dependencies have become a major attack vector: a compromised direct or transitive package, build tool or account can affect applications that never chose it explicitly. loaders.gl is actively working to minimize dependencies, especially transitive dependencies, while retaining the functionality each module needs. Choose only the modules and optional backends your application requires, review dependency changes and advisories, keep supported versions updated, and use a lockfile and your own dependency scanning and software bill of materials.

The [dependency inventory](#dependency-inventory) separates vis.gl ecosystem packages from non-vis.gl packages and records direct and transitive counts for a development installation. This distinction helps identify which packages are maintained in the same ecosystem and which have independent maintainers and release processes. Both groups and their transitive dependencies need review; ecosystem membership alone does not establish how a package is published.

### Workers, code and publishing

Workers and dynamically loaded modules are executable code. Depending on configuration, a worker may be bundled locally, supplied through a `workerUrl`, or loaded from a published CDN bundle. Host or pin worker assets from sources you trust, control their URLs and apply an appropriate content security policy. See [worker loading and URL precedence](developer-guide/using-worker-loaders.md#module-and-classic-workers).

For consumers, obtain packages from trusted registries, review lockfile changes and protect credentials used by builds and deployments. For maintainers, protect repository and registry publishing access, review release changes and keep build dependencies current. loaders.gl publishes its packages to npm using trusted publishing: the [release workflow](https://github.com/visgl/loaders.gl/blob/master/.github/workflows/release.yml) runs tests, builds packages and worker bundles, and requests an OIDC identity for the publish job. External dependencies are published by their own maintainers under their own security and release practices. Other vis.gl projects also have their own workflows; consult each project and registry metadata for its publishing and provenance details.

## Dependency inventory

This snapshot was generated on November 2, 2026 from the non-private `modules/*` manifests and the `node_modules` tree of a clean checkout of loaders.gl `master` at commit `a168860`, after `yarn install --immutable`. It describes that development installation, not a guarantee about a published package or a consumer's dependency graph. Installations, platforms and versions can differ.

The script follows `dependencies` and `optionalDependencies` recursively, including dependencies of local loaders.gl modules. **Direct** counts named direct dependencies, including local modules. **vis.gl total** counts distinct local and installed vis.gl dependency names reached from the module. **Non-vis.gl transitive only** counts distinct other package names reached through another dependency and not also directly declared by the module. **Non-vis.gl total** counts resolved direct and transitive non-vis.gl package names. Each count deduplicates names; the version inventory also distinguishes versions. For this inventory, the vis.gl category includes the @loaders.gl, @math.gl, @luma.gl, @deck.gl and @vis.gl scopes, plus probe.gl and mjolnir.js. This is a project-membership classification, not a statement about individual packages’ trusted-publishing configuration.

The snapshot has no unresolved dependency references. The script explicitly searches the installed npm packages even when a package name, such as `buffer` or `string_decoder`, is also a Node built-in. In the earlier development checkout, those names caused the previous resolver to skip the installed npm packages; they were not evidence of missing packages. These packages are not reachable in this snapshot's runtime dependency graph.

Peer requirements found in the traversed manifests are listed separately without resolving them or distinguishing optional peers. Peer dependencies, development dependencies, vendored code, browser CDN assets, runtime downloads and packages outside `modules/*` are excluded from the counts. As a result, the inventory is not a complete software bill of materials or a security assessment.

To regenerate from an installed checkout, run:

```bash
node scripts/security-dependency-inventory.cjs
```


Published modules: 21
Installed vis.gl package names: 7
Installed non-vis.gl package names: 48
Installed non-vis.gl name/version pairs: 49

| Module | Direct | vis.gl total | Non-vis.gl transitive only | Non-vis.gl total |
| --- | ---: | ---: | ---: | ---: |
| `@loaders.gl/arcgis` | 5 | 18 | 33 | 34 |
| `@loaders.gl/archives` | 2 | 2 | 1 | 1 |
| `@loaders.gl/compression` | 1 | 0 | 0 | 1 |
| `@loaders.gl/core` | 7 | 5 | 9 | 12 |
| `@loaders.gl/crypto` | 0 | 0 | 0 | 0 |
| `@loaders.gl/documents` | 0 | 0 | 0 | 0 |
| `@loaders.gl/geospatial` | 5 | 8 | 11 | 13 |
| `@loaders.gl/graphs` | 2 | 1 | 5 | 6 |
| `@loaders.gl/images` | 2 | 1 | 0 | 1 |
| `@loaders.gl/ogc` | 5 | 7 | 5 | 6 |
| `@loaders.gl/pointclouds` | 4 | 4 | 14 | 17 |
| `@loaders.gl/raster` | 3 | 6 | 5 | 5 |
| `@loaders.gl/scene` | 5 | 3 | 0 | 2 |
| `@loaders.gl/scientific` | 6 | 5 | 12 | 15 |
| `@loaders.gl/services` | 0 | 0 | 0 | 0 |
| `@loaders.gl/splats` | 3 | 1 | 6 | 8 |
| `@loaders.gl/sql` | 1 | 0 | 5 | 6 |
| `@loaders.gl/tables` | 6 | 7 | 10 | 12 |
| `@loaders.gl/tiles` | 12 | 16 | 28 | 33 |
| `@loaders.gl/tiles-3d` | 12 | 13 | 23 | 24 |
| `@loaders.gl/traces` | 3 | 0 | 5 | 8 |

Installed vis.gl package versions (outside the local modules):

- `@math.gl/core@5.0.0-beta.2`
- `@math.gl/dggs@5.0.0-beta.2`
- `@math.gl/earth@5.0.0-beta.2`
- `@math.gl/geometry@5.0.0-beta.2`
- `@math.gl/geospatial@5.0.0-beta.2`
- `@math.gl/web-mercator@5.0.0-beta.2`
- `probe.gl@5.0.0`

Installed non-vis.gl package versions:

- `@bufbuild/protobuf@2.14.0`
- `@mapbox/martini@0.2.0`
- `@mapbox/point-geometry@1.1.0`
- `@maplibre/mlt@1.1.8`
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
