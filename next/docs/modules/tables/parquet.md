Module overview

![](/next/images/format-logos/parquet-logo.png)

# @loaders.gl/tables/parquet

Use Parquet when column selection, metadata pruning, and Arrow-compatible results matter more than reading the whole file.

ArrowParquetselective reads

[Parquet format](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/parquet.md)[ParquetLoader](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

Parquet URLhttps\://raw\.githubusercontent.com/visgl/loaders.gl/master/modules/tables/test/parquet/data/geoparquet/airports.parquet

**Parquet scan parameters**Discovering schema…

Reading source metadata before opening the data…

![From-v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

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

The Parquet module

## Read the columns that matter.

The module spans the simple loader path and the selective cloud path: use rows for convenience, Arrow for typed transport, and sources when metadata can eliminate work before decoding.

01

Load

Decode Parquet into rows or Arrow-compatible tables

02

Select

Prune files, row groups, columns, pages, and predicates

03

Stream

Process batches without materializing the complete dataset

04

Compose

Use GeoParquet, Iceberg, Delta, and scan-aware sources

Experimental loader and writer for the Apache Parquet format.

* `ParquetLoader` uses the TypeScript reader and compress-utils codecs. `ParquetWriter` retains its WASM encoder. Use `parquet.shape: 'object-row-table'` when row objects are required.
* [`ParquetSourceLoader`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md) provides reusable, selective Arrow reads with cached schema and footer metadata. ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)
* [`ParquetDatasetSource`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-source-loader.md#multi-file-datasets) coordinates catalog-backed, multi-file Parquet reads with file pruning and bounded concurrency. ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)
* The optional WASM reader is available as `ParquetWasmLoaderWithParser` from `@loaders.gl/tables/parquet/parquet-wasm-loader`. Install `parquet-wasm` when using this reader or `ParquetWriter`; it is an optional dependency. `ParquetJSLoaderWithParser` shares the TypeScript reader used by the canonical loader. `ParquetJSWriter` provides the TypeScript writer.
* `ParquetLoader` returns an Arrow table by default and `ParquetWriter` accepts loaders.gl Arrow tables.
* Iceberg, Delta Lake, and Hudi table-format sources are available from `@loaders.gl/tables/iceberg`, `@loaders.gl/tables/delta`, and `@loaders.gl/tables/hudi`. They use Parquet for physical file reads and the shared scan contracts from core; installing `@loaders.gl/core/scan` is unnecessary to use them.

The read-only Hudi Copy-on-Write proof of concept is available from `@loaders.gl/tables/hudi`. It consumes a JSON snapshot descriptor listing Parquet base files. Merge-on-Read logs, incremental timeline queries, deletes, and compaction are not supported.

Detailed guide

## Parquet APIs and dataset integrations

The reference below covers loaders, writers, Arrow output, geospatial metadata, selective sources, Iceberg, Delta, and implementation boundaries.

## Geospatial Metadata[​](#geospatial-metadata "Direct link to Geospatial Metadata")

GeoParquet and GeoArrow metadata are handled as two parallel layers:

* GeoParquet `schema.metadata.geo` is preserved as schema/file metadata
* GeoArrow field metadata is added to geometry columns when it can be derived safely

On read, geometry columns are passed through unchanged while loaders.gl maps supported GeoParquet geometry encodings onto field-level GeoArrow metadata.

On write, GeoArrow field metadata can be used to synthesize missing or invalid GeoParquet `geo` metadata before Parquet encoding.

## Attribution[​](#attribution "Direct link to Attribution")

* Based on a fork of <https://github.com/ironSource/parquetjs> and <https://github.com/kbajalc/parquets> under MIT license (Copyright (c) 2017 ironSource Ltd.).
* Delta decoder improvements include adaptations from <https://github.com/hyparam/hyparquet> under the MIT license (Copyright (c) Hyperparam contributors).
* Documentation was inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.

## License[​](#license "Direct link to License")

The retained parquetjs/parquets implementation and hyparquet adaptations use MIT terms. The optional parquet-wasm backend and its dependencies retain their own licenses. See the [tables package notice inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tables/THIRD-PARTY-NOTICES.md).

LZO decompression is supported through compress-utils 0.10.1. Parquet Hadoop block framing is handled in TypeScript. LZO compression is not supported.

The TypeScript reader supports `parquet.rowGroups`, projection, offset, limit, batching, and cancellation. `parquet.wasmUrl` applies only to the explicit WASM reader. `parquet.concurrency` remains accepted for compatibility; the TypeScript loader reads row groups sequentially.
