import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';
import BrowserOnly from '@docusaurus/BrowserOnly';

# ParquetLoader

<ParquetDocsTabs active="parquetloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Streaming loader for Apache Parquet encoded files. `ParquetLoader` is the primary wasm-backed loader;
`ParquetJSLoader` is the experimental TypeScript loader variant. Both return object rows by default
and support Arrow tables through `parquet.shape: 'arrow-table'`.

<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

Please refer to the `parquet` format page for information on
which [Parquet format features](/docs/modules/parquet/formats/parquet) are supported.

## Usage

Load a Parquet file as object rows.

```typescript
import {ParquetJSLoader, ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const wasmRows = await load(url, ParquetLoader, {parquet: options});
const typeScriptRows = await load(url, ParquetJSLoader, {parquet: options});
```

Applications normally import metadata loaders from the package root. Code that needs a
parser-bearing loader directly can import `ParquetLoaderWithParser` from
`@loaders.gl/parquet/parquet-loader` or `ParquetJSLoaderWithParser` from
`@loaders.gl/parquet/parquet-js-loader`.

Load a Parquet file as Arrow using the primary loader.

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const arrowTable = await load(url, ParquetLoader, {
  core: {
    worker: true
  },
  parquet: {
    shape: 'arrow-table',
    signal: abortController.signal
  }
});
```

## Shapes

`ParquetLoader` returns object-row tables by default. Set `parquet.shape: 'arrow-table'` to return loaders.gl `ArrowTable` objects.

| Shape              | Output                                           |
| ------------------ | ------------------------------------------------ |
| `object-row-table` | loaders.gl row table with objects                |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Arrow table  |

## Streaming

The ParquetLoader supports streaming parsing, in which case it will yield "batches" of rows.

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geo.parquet', ParquetLoader, {parquet: options});

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Geospatial Metadata

When `ParquetLoader` reads a GeoParquet file as Arrow:

- the original GeoParquet `geo` metadata is preserved in `schema.metadata.geo`
- matching geometry fields are annotated with GeoArrow field metadata when that mapping is safe
- geometry columns are passed through unchanged; this loader does not convert WKB to native GeoArrow or vice versa in this path

The loader currently maps:

- GeoParquet `encoding: "WKB"` -> `ARROW:extension:name = "geoarrow.wkb"`
- GeoParquet native single-geometry encodings -> matching GeoArrow extension names:
  - `point`
  - `linestring`
  - `polygon`
  - `multipoint`
  - `multilinestring`
  - `multipolygon`
- `crs`, `crs_type`, and `edges` onto field-level `ARROW:extension:metadata` when present

GeoParquet-only schema metadata such as `version`, `primary_column`, `columns`, `geometry_types`,
`bbox`, `covering`, `orientation`, and `epoch` remains in `schema.metadata.geo` and is not mirrored
into GeoArrow field metadata.

If GeoParquet metadata says a column is geospatial but the physical Arrow field is clearly incompatible
with that encoding, loaders.gl preserves the schema-level `geo` metadata and skips adding misleading
field-level GeoArrow metadata.

## Compressions

Async Parquet parsing first probes the runtime's native `DecompressionStream` for gzip, Brotli,
and Zstandard pages. Those probes come from a lightweight entrypoint with no codec imports, and
codec-backed implementations are loaded only when native support is unavailable. Native Zstandard
support is not yet widely available, so inject `zstd-codec` for broad compatibility; when
provided, it takes precedence over the native path. LZ4 still requires `lz4js`.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

```typescript
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

import {ZstdCodec} from 'zstd-codec';
import lz4js from 'lz4js';

const data = await load(url, ParquetLoader, {modules: {
  'zstd-codec': ZstdCodec,
  'lz4js': lz4js,
  // brotli - only needed for compression
});
```

## Data Format

For details see [parquet documentation](https://parquet.apache.org/docs/).

Unannotated Parquet `BYTE_ARRAY` and `FIXED_LEN_BYTE_ARRAY` columns are returned as
`Uint8Array` values. Logical byte-backed columns are decoded according to the schema,
for example `UTF8` values are returned as JavaScript strings and `JSON` values are
returned as parsed JavaScript values.

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.shape` | `'object-row-table' \| 'arrow-table'` | `'object-row-table'` | Selects the returned table shape for `ParquetLoader` and `ParquetJSLoader`. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> |
| `parquet.limit` | `number` | `undefined` | Maximum number of rows to return. |
| `parquet.offset` | `number` | `0` | Number of rows to skip before returning data. |
| `parquet.batchSize` | `number` | `undefined` | Target number of rows per batch when streaming. |
| `parquet.columns` | `string[]` | `undefined` | Restrict parsing to the listed columns. |
| `parquet.rowGroups` | `number[]` | `undefined` | Restrict reading to the listed row groups for the wasm loader implementations. |
| `parquet.concurrency` | `number` | `undefined` | Controls parallel reads for the wasm loader implementations. |
| `parquet.signal` | `AbortSignal` | `undefined` | Cancels worker-backed parsing by terminating its active worker. |
| `parquet.workerUrl` | `string` | package-local asset | Overrides the packaged worker URL. |
| `parquet.wasmUrl` | `string` | package-local asset | Overrides the `parquet-wasm` binary URL for `ParquetLoader`. |

## Loader Variants

- Use `ParquetLoader` for the primary wasm-backed loader. It supports object-row and Arrow output
  and can use the package's prebuilt worker.
- Use `ParquetJSLoader` for the experimental TypeScript implementation. It supports object-row and
  Arrow output plus the common row options listed above, including `columns`, `limit`, `offset`,
  `batchSize`, and `preserveBinary`.

The implementation is selected by the loader import. There is no runtime backend option.

```typescript
import {load} from '@loaders.gl/core';
import {ParquetJSLoader} from '@loaders.gl/parquet';

const table = await load(url, ParquetJSLoader, {
  parquet: {
    columns: ['id', 'name'],
    limit: 100,
    shape: 'arrow-table'
  }
});
```

For `shape: 'arrow-table'`, `ParquetJSLoader` materializes flat selected columns directly into Apache
Arrow batches and preserves compatible GeoParquet metadata on the Arrow schema. Flat `UTF8`,
`BYTE_ARRAY`, and `FIXED_LEN_BYTE_ARRAY` columns are assembled directly into Arrow offset, validity,
and value buffers without converting their bytes through JavaScript strings. Nested schemas use the
object-row materializer as a compatibility fallback.

## Worker Execution

The primary `ParquetLoader` can decode on a worker when workers are enabled. The Parquet bytes are transferred into the worker, and Arrow output returns as a transferable Arrow IPC payload that is rehydrated into Apache Arrow class instances on the main thread. Aborting `parquet.signal` terminates the active worker rather than waiting for a non-cancellable WASM call to finish.

The package publishes `parquet-worker.js` and `parquet_wasm_bg.wasm` beside its JavaScript output. The metadata loader resolves the worker with a module-relative `new URL(..., import.meta.url)`, while the worker resolves the WASM file beside itself. This lets compatible bundlers copy and fingerprint both assets without an implicit CDN request. Use `parquet.workerUrl` or `parquet.wasmUrl` when an application serves assets from a custom location.

Set `core.worker: false` to decode on the calling thread. `ParquetJSLoader` always parses on the calling thread and does not add another prebuilt worker to the package. Node worker threads for `ParquetLoader` remain opt-in through `core._nodeWorkers`.

## Live Benchmarks

These benchmarks compare maintained JavaScript and WebAssembly Arrow-table decode paths on common,
checked-in fixtures. They are a reproducible baseline for finding optimization opportunities in the
loaders.gl TypeScript backend, not a ranking of projects.

The suite runs entirely in your browser. Fixture download and parser initialization happen before
timing; each implementation is warmed up and must return the same row count. The suite focuses on
Arrow output and retains one object-row control to expose row-materialization cost. Results depend on
the browser, hardware, thermal state, and whether this tab remains focused.

The live suite includes both loaders.gl loader variants plus a browser-oriented peer reader.
Dependency versions are pinned in the repository lockfile. The corresponding Node suite covers
additional codecs and projections with `yarn bench parquet`.

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const ParquetBenchmarksApp = require('@site/src/examples/parquet-benchmarks-app').default;
    return <ParquetBenchmarksApp />;
  }}
</BrowserOnly>

## Remarks

- The legacy `ParquetJSONLoader` compatibility alias has been removed. Use `ParquetLoader`.
