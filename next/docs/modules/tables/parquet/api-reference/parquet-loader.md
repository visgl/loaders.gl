Parquet module / loader

# ParquetLoader

Start with a familiar load call, then opt into Arrow output, batches, or the selective source API as the dataset grows.

ArrowParquetselective reads

[Parquet format](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Parquet source](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source.md)

[![](/next/images/format-logos/parquet-logo.png)](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Try It](https://loaders.gl/next/examples/geospatial/geoparquet)[Overview](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[Format](https://loaders.gl/next/docs/modules/tables/parquet/format.md)[GeoParquet](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[GeoParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/geoparquet-loader.md)[ParquetWriter](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

The Parquet layout

## Read the footer. Fetch the useful ranges.

A Parquet file keeps its directory at the end. A reader can inspect that small suffix, choose columns and row groups, and decode only the ranges that survive planning.

PAR1

row group 0read

idstatusgeometry

row group 1skip

idstatusgeometry

row group 2read

idstatusgeometry

file metadataschema · statistics · page indexes**PAR1**

01**Inspect**footer and schema

→

02**Request**selected ranges

→[03**Arrow batches**typed columns, ready to use ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The exact pruning layers depend on the source and indexes, but the application receives the same Arrow-shaped result.

What ParquetLoader returns

## Start with rows. Keep a columnar path open.

ParquetLoader can return familiar object rows, Arrow-compatible tables, or incremental batches. The same entry point can stay useful as files become wider, larger, and more selective.

01

Default

Native Apache Arrow Table

02

Rows

Object-row tables with parquet.shape: 'object-row-table'

03

Streaming

Batches for incremental processing and lower peak memory

04

Selective path

Use createDataSource() for footer and range-aware reads

![From-v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

`ParquetLoader` reads Apache Parquet files and returns native Arrow tables by default. Use `parquet.shape` to select the output shape.

Please refer to the `parquet` format page for information on which [Parquet format features](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md) are supported.

Detailed guide

## Loader usage and compatibility

The sections below cover row and Arrow shapes, streaming, geospatial metadata, loader variants, and the options that control decoding.

Use `createDataSource(url, ParquetLoader)` for reusable metadata and selective range reads. See the [Parquet source API](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source.md) for query options.

| Property    | Value           |
| ----------- | --------------- |
| Data source | `ParquetSource` |

## Usage[​](#usage "Direct link to Usage")

Load a Parquet file as object rows when a row-oriented result is required.

```
import {ParquetLoader} from '@loaders.gl/tables/parquet';

import {load} from '@loaders.gl/core';



const loaderOptions = {parquet: {batchSize: 10_000, shape: 'object-row-table'}};

const rows = await load(url, ParquetLoader, loaderOptions);
```

Applications normally import metadata loaders from the package root. Code that needs a parser-bearing loader directly can import `ParquetLoaderWithParser` from `@loaders.gl/tables/parquet`.

Load a Parquet file as Arrow using the primary loader.

```
import {ParquetLoader} from '@loaders.gl/tables/parquet';

import {load} from '@loaders.gl/core';



const abortController = new AbortController();

const arrowTable = await load(url, ParquetLoader, {

  core: {

    worker: true

  },

  parquet: {

    shape: 'arrow',

    signal: abortController.signal

  }

});
```

## Shapes[​](#shapes "Direct link to Shapes")

`ParquetLoader` returns native Apache Arrow `Table` objects by default. Set `parquet.shape: 'object-row-table'` when row objects are required.

| Shape              | Output                            |
| ------------------ | --------------------------------- |
| `object-row-table` | loaders.gl row table with objects |
| `arrow`            | Apache Arrow `Table`              |

## Streaming[​](#streaming "Direct link to Streaming")

The ParquetLoader supports streaming parsing, in which case it will yield "batches" of rows.

```
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

### Worker batches[​](#worker-batches "Direct link to Worker batches")

The canonical `ParquetLoader` supports worker batches for both `arrow` and `object-row-table` output. Enable workers with `core.worker: true`, or set `core.workerInBatches: false` to keep batch parsing on the caller. Explicit custom worker URLs also require `core.workerInBatches: true` to confirm support for the batch protocol.

```
const controller = new AbortController();

const batches = await loadInBatches('data.parquet', ParquetLoader, {

  core: {worker: true},

  parquet: {shape: 'arrow', batchSize: 1024},

  signal: controller.signal,

  onProgress: ({phase, completed, unit}) => console.log(phase, completed, unit)

});

for await (const batch of batches) {

  consume(batch); // A hydrated Apache Arrow RecordBatch on the caller.

}
```

One worker retains parser state until the iterator completes or is closed. Projection, row-group selection, offset, limit, and `parquet.batchSize` apply inside that worker. Owned Arrow column buffers transport each batch and preserves Arrow types, nested values, and metadata without detaching retained parser buffers. Object rows are materialized on the caller after the decoded Arrow batch is hydrated. Progress reports decoded rows. Aborting terminates the worker, rejects with the caller's abort reason, and leaves pool capacity available for subsequent work.

Parquet input chunks are currently collected into a complete file inside the worker before decoding. This reduces parsing work on the caller but does not provide incremental input decoding or bounded whole-file memory. For random-access/range reads, use `ParquetSource` and its source-worker options. Calls with `parquet.keyRetriever` run on the caller to preserve the encryption callback. The explicit This capability is specific to `ParquetLoader`.

## Geospatial Metadata[​](#geospatial-metadata "Direct link to Geospatial Metadata")

When `ParquetLoader` reads a GeoParquet file as Arrow:

* the original GeoParquet `geo` metadata is preserved in `schema.metadata.geo`
* matching geometry fields are annotated with GeoArrow field metadata when that mapping is safe
* geometry columns are passed through unchanged; this loader does not convert WKB to native GeoArrow or vice versa in this path

The loader currently maps:

* GeoParquet `encoding: "WKB"` -> `ARROW:extension:name = "geoarrow.wkb"`

* GeoParquet native single-geometry encodings -> matching GeoArrow extension names:

  <!-- -->

  * `point`
  * `linestring`
  * `polygon`
  * `multipoint`
  * `multilinestring`
  * `multipolygon`

* `crs`, `crs_type`, and `edges` onto field-level `ARROW:extension:metadata` when present

GeoParquet-only schema metadata such as `version`, `primary_column`, `columns`, `geometry_types`, `bbox`, `covering`, `orientation`, and `epoch` remains in `schema.metadata.geo` and is not mirrored into GeoArrow field metadata.

If GeoParquet metadata says a column is geospatial but the physical Arrow field is clearly incompatible with that encoding, loaders.gl preserves the schema-level `geo` metadata and skips adding misleading field-level GeoArrow metadata.

## Compressions[​](#compressions "Direct link to Compressions")

Parquet codecs use compress-utils, including raw LZ4 and LZO decoding. Hadoop LZO block framing is handled by a TypeScript adapter. No `lz4js`, `zstd-codec`, or Brotli module injection is required. LZO compression is unsupported.

## Data Format[​](#data-format "Direct link to Data Format")

For details see [parquet documentation](https://parquet.apache.org/docs/).

Unannotated Parquet `BYTE_ARRAY` and `FIXED_LEN_BYTE_ARRAY` columns are returned as `Uint8Array` values. Logical byte-backed columns are decoded according to the schema, for example `UTF8` values are returned as JavaScript strings and `JSON` values are returned as parsed JavaScript values.

Unshredded Parquet `VARIANT` groups are decoded into JavaScript primitives, arrays, and objects for object-row results from `ParquetLoader`. Arrow results and the explicit WASM reader retain the canonical `metadata` and `value` binary child fields so applications can choose when to decode or project them. Shredded Variant values are currently exposed as their typed child columns and are not yet reconstructed into one JavaScript value.

`ParquetLoader` reads the Parquet 2.13 `LogicalType` annotation before using the legacy `ConvertedType` fallback. Arrow output preserves exact signed and unsigned integer widths, date/time/timestamp units through nanoseconds, Decimal128/256 precision and scale, UUID fixed-size binary width, and FLOAT16 values. Parameterized logical metadata such as field IDs, UTC adjustment, Variant versions, coordinate reference systems, and Geography edge algorithms is retained in the serialized field metadata.

## Options[​](#options "Direct link to Options")

Supports table category options such as `batchType` and `batchSize`.

| Option                          | Type                            | Default                                                     | Description                                                                                                                                  |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `parquet.shape`                 | `'arrow' \| 'object-row-table'` | `'arrow'`                                                   | Selects the returned table shape.                                                                                                            |
| `parquet.limit`                 | `number`                        | `undefined`                                                 | Deprecated for direct parsing. Put the maximum row count in a [logical query](https://loaders.gl/next/docs/modules/core/scan/query.md). |
| `parquet.offset`                | `number`                        | `0`                                                         | Deprecated for direct parsing. Put the row offset in a [logical query](https://loaders.gl/next/docs/modules/core/scan/query.md).        |
| `parquet.batchSize`             | `number`                        | `undefined`                                                 | Target number of rows per batch when streaming.                                                                                              |
| `parquet.columns`               | `string[]`                      | `undefined`                                                 | Restrict parsing to the listed columns.                                                                                                      |
| `parquet.rowGroups`             | `number[]`                      | `undefined`                                                 | Read the listed zero-based row groups in the requested order.                                                                                |
| `parquet.concurrency`           | `number`                        | `undefined`                                                 | Controls parallel reads for the explicit WASM reader; accepted but unused by the sequential TypeScript loader.                               |
| `parquet.signal`                | `AbortSignal`                   | `undefined`                                                 | Cancels worker-backed parsing by terminating its active worker.                                                                              |
| `parquet.workerUrl`             | `string`                        | module worker                                               | Overrides the default worker with a custom URL.                                                                                              |
| `parquet.keyRetriever`          | `ParquetKeyRetriever`           | `undefined`                                                 | Resolves keys for modular-encrypted files.                                                                                                   |
| `parquet.aadPrefix`             | `Uint8Array`                    | `undefined`                                                 | Supplies the AAD prefix for encrypted files that omit it from their crypto metadata.                                                         |
| `parquet.int96AsTimestamp`      | `boolean`                       | `false` for object rows, `true` for TypeScript Arrow output | Decodes legacy INT96 physical values as signed epoch-nanosecond timestamps.                                                                  |
| `parquet.verifyFooterSignature` | `boolean`                       | `true`                                                      | Verifies plaintext-footer signatures on modular-encrypted files when a `keyRetriever` is supplied.                                           |

## Arrow decoding[​](#arrow-decoding "Direct link to Arrow decoding")

For `shape: 'arrow'`, `ParquetLoader` materializes flat selected columns directly into Apache Arrow batches and preserves compatible GeoParquet metadata on the Arrow schema. Flat `UTF8`, `BYTE_ARRAY`, and `FIXED_LEN_BYTE_ARRAY` columns are assembled directly into Arrow offset, validity, and value buffers without converting their bytes through JavaScript strings or copying every value into an intermediate buffer. Nested schemas use the object-row materializer as a compatibility fallback.

Physical Parquet `INT64` columns map to Arrow `Int64`. Both Arrow and object-row output return exact JavaScript `bigint` values; callers that accept precision loss can convert them to `number` explicitly.

## Worker Execution[​](#worker-execution "Direct link to Worker Execution")

The primary `ParquetLoader` can decode on a worker when workers are enabled. The Parquet bytes are transferred into the worker, and all decoded data returns as directly transferable Arrow column buffers; requested object rows are materialized on the caller after hydration. Arrow output is rehydrated into Apache Arrow class instances on the caller. Aborting `parquet.signal` terminates the active worker without waiting for the current decode to finish.

Set `core.worker: false` to decode on the calling thread. Node worker threads for `ParquetLoader` remain opt-in through `core._nodeWorkers`.

## Live Benchmarks[​](#live-benchmarks "Direct link to Live Benchmarks")

Live Arrow decode throughput on representative, checked-in Parquet fixtures. Exact external package versions appear in the table headers. The comparison includes the published `ParquetLoader`, the website’s alternate ParquetJS and WASM readers, and hyparquet.

Loading browser benchmarks...

* 🟢 marks the fastest completed result in each row.
* `N/A` is excluded, `Failed` is a runtime error, and `Incorrect` is a row-count mismatch.
* Results vary by browser and hardware; keep this tab focused while the suite runs.

Methodology and coverage

* Downloads and parser initialization are excluded from timing; each implementation is warmed up.
* Results must match the validated row count. Projection rows include extra work when an implementation returns the complete fixture table.
* The primarily Arrow-focused matrix covers nullable, nested, repeated, dictionary, delta, projection, and compression cases, plus one object-row control.
* Main fixtures span 1,000–40,000 rows, up to 66 columns, and multiple row groups. Scenario labels show row and top-level column counts.
* External versions are pinned in the lockfile. Compression support for `hyparquet` uses `hyparquet-compressors` 1.1.1.
* Run `yarn bench parquet` for the broader Node benchmark suite.

This is a reproducible optimization baseline across maintained JavaScript and WebAssembly paths, not a ranking of projects.

## Remarks[​](#remarks "Direct link to Remarks")

* The legacy `ParquetJSONLoader` compatibility alias has been removed. Use `ParquetLoader`.

Application bundlers resolve the Parquet module worker from the loader package. Native browser ESM uses the packaged standalone browser worker, which can load independently of the page’s import map. Node uses the packaged Node worker. Set `parquet.workerUrl` to use a custom worker URL.
