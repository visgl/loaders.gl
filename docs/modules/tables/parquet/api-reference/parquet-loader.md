---
title: ParquetLoader
description: Read Parquet files with object rows, Arrow tables, and streaming batches.
hide_title: true
page_style: designed
---

import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';
import {ParquetLayoutGraphic} from '@site/src/components/docs/parquet-layout-graphic';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero
  capability="columnar"
  eyebrow="Parquet module / loader"
  title="ParquetLoader"
  description="Start with a familiar load call, then opt into Arrow output, batches, or the selective source API as the dataset grows."
  links={[
    {label: 'Parquet format', to: '/docs/modules/tables/parquet/formats/parquet'},
    {label: 'Parquet source', to: '/docs/modules/tables/parquet/api-reference/parquet-source-loader'}
  ]}
/>

<ParquetDocsTabs active="parquetloader" />

<ParquetLayoutGraphic />

<DocOrientation
  eyebrow="What ParquetLoader returns"
  title="Start with rows. Keep a columnar path open."
  description="ParquetLoader can return familiar object rows, Arrow-compatible tables, or incremental batches. The same entry point can stay useful as files become wider, larger, and more selective."
  tone="mint"
  items={[
    {label: 'Default', value: "ArrowTable output with parquet.shape: 'arrow-table'"},
    {label: 'Rows', value: "Object-row tables with parquet.shape: 'object-row-table'"},
    {label: 'Streaming', value: 'Batches for incremental processing and lower peak memory'},
    {label: 'Selective path', value: 'Use ParquetSourceLoader for footer and range-aware reads'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

Streaming loader for Apache Parquet encoded files. `ParquetLoader` is the primary TypeScript-backed loader
and `ParquetJSLoader` is the experimental TypeScript loader variant. Both return Arrow tables by
default and support explicit shape selection through `parquet.shape`.

Please refer to the `parquet` format page for information on
which [Parquet format features](/docs/modules/tables/parquet/formats/parquet) are supported.

<ReferenceBoundary
  title="Loader usage and compatibility"
  description="The sections below cover row and Arrow shapes, streaming, geospatial metadata, loader variants, and the options that control decoding."
  tone="mint"
/>

## Usage

Load a Parquet file as object rows when a row-oriented result is required.

```typescript
import {ParquetLoader} from '@loaders.gl/tables/parquet';
import {ParquetJSLoaderWithParser as ParquetJSLoader} from '@loaders.gl/tables/parquet/parquet-js-loader';
import {load} from '@loaders.gl/core';

const loaderOptions = {parquet: {batchSize: 10_000, shape: 'object-row-table'}};
const wasmRows = await load(url, ParquetLoader, loaderOptions);
const typeScriptRows = await load(url, ParquetJSLoader, loaderOptions);
```

Applications normally import metadata loaders from the package root. Code that needs a
parser-bearing loader directly can import `ParquetLoaderWithParser` from
`@loaders.gl/tables/parquet/parquet-loader` or `ParquetJSLoaderWithParser` from
`@loaders.gl/tables/parquet/parquet-js-loader`.

Load a Parquet file as Arrow using the primary loader.

```typescript
import {ParquetLoader} from '@loaders.gl/tables/parquet';
import {load} from '@loaders.gl/core';

const abortController = new AbortController();
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

Both `ParquetLoader` and `ParquetJSLoader` return loaders.gl `ArrowTable` objects by default. Set `parquet.shape: 'object-row-table'` when row objects are required.

| Shape              | Output                                           |
| ------------------ | ------------------------------------------------ |
| `object-row-table` | loaders.gl row table with objects                |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Arrow table  |

## Streaming

The ParquetLoader supports streaming parsing, in which case it will yield "batches" of rows.

```typescript
import {ParquetLoader} from '@loaders.gl/tables/parquet';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geo.parquet', ParquetLoader, {
  parquet: {...options, shape: 'object-row-table'}
});

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

### Worker batches

The canonical `ParquetLoader` supports worker batches for both `arrow-table` and
`object-row-table` output. Enable workers with `core.worker: true`, or set
`core.workerInBatches: false` to keep batch parsing on the caller. Explicit custom worker URLs
also require `core.workerInBatches: true` to confirm support for the batch protocol.

```typescript
const controller = new AbortController();
const batches = await loadInBatches('data.parquet', ParquetLoader, {
  core: {worker: true},
  parquet: {shape: 'arrow-table', batchSize: 1024},
  signal: controller.signal,
  onProgress: ({phase, completed, unit}) => console.log(phase, completed, unit)
});
for await (const batch of batches) {
  consume(batch.data); // A hydrated Apache Arrow Table on the caller.
}
```

One worker retains parser state until the iterator completes or is closed. Projection, row-group
selection, offset, limit, and `parquet.batchSize` apply inside that worker. Owned Arrow column buffers transport each
batch and preserves Arrow types, nested values, and metadata without detaching retained parser
buffers. Object rows are materialized on the caller after the decoded Arrow batch is hydrated. Progress reports decoded rows. Aborting terminates the worker,
rejects with the caller's abort reason, and leaves pool capacity available for subsequent work.

Parquet input chunks are currently collected into a complete file inside the worker before decoding.
This reduces parsing work on the caller but does not provide incremental input decoding or bounded
whole-file memory. For random-access/range reads, use `ParquetSource` and its source-worker options.
Calls with `parquet.keyRetriever` run on the caller to preserve the encryption callback. The explicit
WASM backend, `ParquetJSLoader`, and `GeoParquetLoader` are not enabled by this capability.

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

Parquet codecs use compress-utils, including raw LZ4 and LZO decoding. Hadoop LZO block framing is handled by a TypeScript adapter. No `lz4js`, `zstd-codec`, or Brotli module injection is required. LZO compression is unsupported.

## Data Format

For details see [parquet documentation](https://parquet.apache.org/docs/).

Unannotated Parquet `BYTE_ARRAY` and `FIXED_LEN_BYTE_ARRAY` columns are returned as
`Uint8Array` values. Logical byte-backed columns are decoded according to the schema,
for example `UTF8` values are returned as JavaScript strings and `JSON` values are
returned as parsed JavaScript values.

Unshredded Parquet `VARIANT` groups are decoded into JavaScript primitives, arrays, and
objects for object-row results from the TypeScript `ParquetJSLoader` variant. Arrow results
and the explicit WASM reader retain the canonical `metadata` and `value` binary child
fields so applications can choose when to decode or project them. Shredded Variant values
are currently exposed as their typed child columns and are not yet reconstructed into one
JavaScript value.

`ParquetJSLoader` reads the Parquet 2.13 `LogicalType` annotation before using the legacy
`ConvertedType` fallback. Arrow output preserves exact signed and unsigned integer widths,
date/time/timestamp units through nanoseconds, Decimal128/256 precision and scale, UUID fixed-size
binary width, and FLOAT16 values. Parameterized logical metadata such as field IDs, UTC adjustment,
Variant versions, coordinate reference systems, and Geography edge algorithms is retained in the
serialized field metadata.

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.shape` | `'object-row-table' \| 'arrow-table'` | `'arrow-table'` | Selects the returned table shape. |
| `parquet.limit` | `number` | `undefined` | Maximum number of rows to return. |
| `parquet.offset` | `number` | `0` | Number of rows to skip before returning data. |
| `parquet.batchSize` | `number` | `undefined` | Target number of rows per batch when streaming. |
| `parquet.columns` | `string[]` | `undefined` | Restrict parsing to the listed columns. |
| `parquet.rowGroups` | `number[]` | `undefined` | Read the listed zero-based row groups in the requested order. |
| `parquet.concurrency` | `number` | `undefined` | Controls parallel reads for the explicit WASM reader; accepted but unused by the sequential TypeScript loader. |
| `parquet.signal` | `AbortSignal` | `undefined` | Cancels worker-backed parsing by terminating its active worker. |
| `parquet.workerUrl` | `string` | package-local asset | Overrides the packaged worker URL. |
| `parquet.wasmUrl` | `string` | package-local asset | Overrides the `parquet-wasm` binary URL for the explicit WASM reader. |
| `parquet.keyRetriever` | `ParquetKeyRetriever` | `undefined` | Resolves keys for modular-encrypted files when using `ParquetJSLoader`. |
| `parquet.aadPrefix` | `Uint8Array` | `undefined` | Supplies the AAD prefix for encrypted files that omit it from their crypto metadata. |
| `parquet.int96AsTimestamp` | `boolean` | `false` for object rows, `true` for TypeScript Arrow output | Decodes legacy INT96 physical values as signed epoch-nanosecond timestamps. |
| `parquet.verifyFooterSignature` | `boolean` | `true` | Verifies plaintext-footer signatures on modular-encrypted files when a `keyRetriever` is supplied. |

## Loader Variants

- Use `ParquetLoader` for the primary TypeScript-backed loader. It supports object-row and Arrow output
  and can use the package's prebuilt worker.
- Use `ParquetJSLoader` for the experimental TypeScript implementation. It supports object-row and
  Arrow output plus the common row options listed above, including `columns`, `limit`, `offset`,
  `batchSize`, and `preserveBinary`. It can also read AES-GCM and AES-GCM-CTR encrypted column
  metadata, page indexes, Bloom filters, and page modules when `keyRetriever` is supplied. Plaintext
  footer signatures are verified by default.

For the optional WASM reader, import `ParquetWasmLoaderWithParser` from `@loaders.gl/tables/parquet/parquet-wasm-loader` and install `parquet-wasm`. The implementation is selected by the loader import. There is no runtime backend option.
The [JavaScript and WebAssembly performance](/docs/developer-guide/concepts/javascript-and-wasm-performance)
concept guide explains why selective I/O, direct Arrow construction, memory copies, and startup cost
can matter more than the language used for a decoder's inner loop.

```typescript
import {load} from '@loaders.gl/core';
import {ParquetJSLoaderWithParser as ParquetJSLoader} from '@loaders.gl/tables/parquet/parquet-js-loader';

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
and value buffers without converting their bytes through JavaScript strings or copying every value
into an intermediate buffer. Nested schemas use the object-row materializer as a compatibility
fallback.

Physical Parquet `INT64` columns map to Arrow `Int64`. Both Arrow and object-row output return exact
JavaScript `bigint` values; callers that accept precision loss can convert them to `number`
explicitly.

## Worker Execution

The primary `ParquetLoader` can decode on a worker when workers are enabled. The Parquet bytes are transferred into the worker, and all decoded data returns as directly transferable Arrow column buffers; requested object rows are materialized on the caller after hydration. Arrow output is rehydrated into Apache Arrow class instances on the caller. Aborting `parquet.signal` terminates the active worker rather than waiting for a non-cancellable WASM call to finish.

The package publishes `parquet-worker.js` and `parquet_wasm_bg.wasm` beside its JavaScript output. The metadata loader resolves the worker with a module-relative `new URL(..., import.meta.url)`, while the worker resolves the WASM file beside itself. This lets compatible bundlers copy and fingerprint both assets without an implicit CDN request. Use `parquet.workerUrl` or `parquet.wasmUrl` when an application serves assets from a custom location.

Set `core.worker: false` to decode on the calling thread. `ParquetJSLoader` always parses on the calling thread and does not add another prebuilt worker to the package. Node worker threads for `ParquetLoader` remain opt-in through `core._nodeWorkers`.

## Live Benchmarks

Live Arrow decode throughput on representative, checked-in Parquet fixtures. Exact external package
versions appear in the table headers.

<BrowserOnly fallback={<p>Loading browser benchmarks...</p>}>
  {() => {
    const ParquetBenchmarksApp = require('@site/src/examples/parquet-benchmarks-app').default;
    return <ParquetBenchmarksApp />;
  }}
</BrowserOnly>

- 🟢 marks the fastest completed result in each row.
- `N/A` is excluded, `Failed` is a runtime error, and `Incorrect` is a row-count mismatch.
- Results vary by browser and hardware; keep this tab focused while the suite runs.

<details>
  <summary>Methodology and coverage</summary>

  - Downloads and parser initialization are excluded from timing; each implementation is warmed up.
  - Results must match the validated row count. Projection rows include extra work when an
    implementation returns the complete fixture table.
  - The primarily Arrow-focused matrix covers nullable, nested, repeated, dictionary, delta,
    projection, and compression cases, plus one object-row control.
  - Main fixtures span 1,000–40,000 rows, up to 66 columns, and multiple row groups. Scenario labels
    show row and top-level column counts.
  - External versions are pinned in the lockfile. Compression support for `hyparquet` uses
    `hyparquet-compressors` 1.1.1.
  - Run `yarn bench parquet` for the broader Node benchmark suite.

  This is a reproducible optimization baseline across maintained JavaScript and WebAssembly paths,
  not a ranking of projects.
</details>

## Remarks

- The legacy `ParquetJSONLoader` compatibility alias has been removed. Use `ParquetLoader`.
