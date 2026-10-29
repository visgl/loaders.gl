Loader utilities

# Give format implementations the same transport primitives.

`@loaders.gl/core/loader-utils` contains the lower-level contracts used by loaders and sources: random-access files, HTTP ranges, request scheduling, caches, URI resolution, and context-aware parsing.

[Readable files](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md)[HTTP files](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)[Range scheduling](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

The loader utility boundary

## Normalize transport once. Let each loader focus on its format.

These utilities make remote and local data look alike to a loader, then add the controls needed for large datasets: bounded concurrency, byte-range coalescing, caching, stable references, and parser context.

01

Files

ReadableFile, ArrayBufferFile, and HttpFile

02

Requests

Schedulers for concurrency and byte ranges

03

Caches

Request and exact-range result reuse

04

Context

URI resolution and nested parser coordination

Detailed guide

## Transport and loader-building details

The reference below lists the shared file, request, cache, URI, and context APIs used by format implementations and cloud-native sources.

The `@loaders.gl/core/loader-utils` contains utilities for creating loaders.

## API[​](#api "Direct link to API")

* [`ReadableFile`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md) provides the common random-access file contract.

* [`ArrayBufferFile`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md#adapting-an-arraybuffer) provides direct random access to in-memory data.

* [`HttpFile`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md) validates random-access HTTP reads and remote object identity.

* [`RequestScheduler`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-scheduler.md) limits asynchronous request concurrency.

* [Numeric raster data](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/raster-data.md) defines region, affine, validity and CPU sampling contracts.

* [`RangeRequestScheduler`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md) coalesces compatible byte ranges.

* [`RequestCache`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-cache.md) deduplicates and bounds ordinary asynchronous request results.

* [`RangeRequestCache`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-cache.md) caches exact and contained byte ranges.

* [`CachedUriResolver`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/cached-uri-resolver.md) resolves resource references against one stable base and memoizes repeated derivations for a caller-controlled lifetime.

* [`encodeArrayBufferToBase64`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/encode-array-buffer-to-base64.md) encodes binary bytes as padded base64.

* [`initializeWasmModule`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/initialize-wasm-module.md) forwards WASM initialization errors and safely extracts Emscripten exports.

## Tile-grid normalization[​](#tile-grid-normalization "Direct link to Tile-grid normalization")

Source implementations can share `createTileGrid(crs, matrices)`, `createTileGridMatrix(fields)`, `getRequestedTileMatrix(matrices, getId, parameters)`, and `getTileGridMatrixId(grid, parameters)`. Grid construction preserves incomplete advertised metadata and exposes complete math.gl geometry only when every level validates. Matrix fields may include `resolutionY` for vertical pixel size; `resolution` is horizontal and remains the default for both axes.

Protocol-specific CRS and scale interpretation belongs in source modules. These helpers perform no reprojection, extent-based inference, or source fetching. See [Tile matrices and tile matrix sets](https://loaders.gl/next/docs/developer-guide/tile-matrices.md).

## Tile grids[​](#tile-grids "Direct link to Tile grids")

[Grid validation and addressing](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/tile-grid.md) covers complete versus partial metadata, coverage diagnostics and canonical coalesced tile requests.
