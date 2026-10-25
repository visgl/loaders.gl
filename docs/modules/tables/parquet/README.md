---
title: '@loaders.gl/tables/parquet'
description: Read and write Parquet with selective scans, Arrow output, and cloud-friendly ranges.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {ParquetLayoutGraphic} from '@site/src/components/docs/parquet-layout-graphic';
import {ParquetScanLiveExample} from '@site/src/components/docs/parquet-scan-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero
  capability="columnar"
  eyebrow="Module overview"
  title="@loaders.gl/tables/parquet"
  description="Use Parquet when column selection, metadata pruning, and Arrow-compatible results matter more than reading the whole file."
  logos={[
    {alt: 'Apache Parquet', format: 'parquet'}
  ]}
  links={[
    {label: 'Parquet format', to: '/docs/modules/tables/parquet/formats/parquet'},
    {label: 'ParquetLoader', to: '/docs/modules/tables/parquet/api-reference/parquet-loader'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<ParquetScanLiveExample />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

<ParquetLayoutGraphic />

<DocOrientation
  eyebrow="The Parquet module"
  title="Read the columns that matter."
  description="The module spans the simple loader path and the selective cloud path: use rows for convenience, Arrow for typed transport, and sources when metadata can eliminate work before decoding."
  tone="mint"
  items={[
    {label: 'Load', value: 'Decode Parquet into rows or Arrow-compatible tables'},
    {label: 'Select', value: 'Prune files, row groups, columns, pages, and predicates'},
    {label: 'Stream', value: 'Process batches without materializing the complete dataset'},
    {label: 'Compose', value: 'Use GeoParquet, Iceberg, Delta, and scan-aware sources'}
  ]}
/>

Experimental loader and writer for the Apache Parquet format.

- `ParquetLoader` uses the TypeScript reader and compress-utils codecs. `ParquetWriter` retains its WASM encoder. Use `parquet.shape: 'object-row-table'` when row objects are required.
- [`ParquetSourceLoader`](/docs/modules/tables/parquet/api-reference/parquet-source-loader) provides reusable, selective Arrow reads with cached schema and footer metadata. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`ParquetDatasetSource`](/docs/modules/tables/parquet/api-reference/parquet-source-loader#multi-file-datasets) coordinates catalog-backed, multi-file Parquet reads with file pruning and bounded concurrency. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- The optional WASM reader is available as `ParquetWasmLoaderWithParser` from `@loaders.gl/tables/parquet/parquet-wasm-loader`. Install `parquet-wasm` when using this reader or `ParquetWriter`; it is an optional dependency. `ParquetJSLoaderWithParser` shares the TypeScript reader used by the canonical loader. `ParquetJSWriter` provides the TypeScript writer.
- `ParquetLoader` returns an Arrow table by default and `ParquetWriter` accepts loaders.gl Arrow tables.
- Iceberg, Delta Lake, and Hudi table-format sources are available from
  `@loaders.gl/tables/iceberg`, `@loaders.gl/tables/delta`, and `@loaders.gl/tables/hudi`.
  They use Parquet for physical file reads and the shared
  scan contracts from core; installing `@loaders.gl/scan` is unnecessary to use them.

The read-only Hudi Copy-on-Write proof of concept is available from
`@loaders.gl/tables/hudi`. It consumes a JSON snapshot descriptor listing
Parquet base files. Merge-on-Read logs, incremental timeline queries, deletes, and compaction are
not supported.

<ReferenceBoundary
  title="Parquet APIs and dataset integrations"
  description="The reference below covers loaders, writers, Arrow output, geospatial metadata, selective sources, Iceberg, Delta, and implementation boundaries."
  tone="mint"
/>

## Geospatial Metadata

GeoParquet and GeoArrow metadata are handled as two parallel layers:

- GeoParquet `schema.metadata.geo` is preserved as schema/file metadata
- GeoArrow field metadata is added to geometry columns when it can be derived safely

On read, geometry columns are passed through unchanged while loaders.gl maps supported GeoParquet
geometry encodings onto field-level GeoArrow metadata.

On write, GeoArrow field metadata can be used to synthesize missing or invalid GeoParquet `geo`
metadata before Parquet encoding.

## Attribution

- Based on a fork of https://github.com/ironSource/parquetjs and https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.).
- Delta decoder improvements include adaptations from https://github.com/hyparam/hyparquet under the MIT license (Copyright (c) Hyperparam contributors).
- Documentation was inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.

## License

The retained parquetjs/parquets implementation and hyparquet adaptations use MIT terms.
The optional parquet-wasm backend and its dependencies retain their own licenses.
See the [tables package notice inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tables/THIRD-PARTY-NOTICES.md).

LZO decompression is supported through compress-utils 0.10.1. Parquet Hadoop block framing is handled in TypeScript. LZO compression is not supported.

The TypeScript reader supports `parquet.rowGroups`, projection, offset, limit, batching, and cancellation. `parquet.wasmUrl` applies only to the explicit WASM reader. `parquet.concurrency` remains accepted for compatibility; the TypeScript loader reads row groups sequentially.
