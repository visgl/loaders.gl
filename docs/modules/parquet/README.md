---
title: '@loaders.gl/parquet'
description: Read and write Parquet with selective scans, Arrow output, and cloud-friendly ranges.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Module overview"
  title="@loaders.gl/parquet"
  description="Use Parquet when column selection, metadata pruning, and Arrow-compatible results matter more than reading the whole file."
  tone="mint"
  meta={['Parquet and GeoParquet', 'Arrow output', 'Selective reads']}
  links={[
    {label: 'Parquet format', to: '/docs/modules/parquet/formats/parquet'},
    {label: 'ParquetLoader', to: '/docs/modules/parquet/api-reference/parquet-loader'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

![parquet-logo](./images/parquet-logo-small.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

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

- `ParquetLoader` and `ParquetWriter` are the default wasm-backed plain-row APIs.
- [`ParquetSourceLoader`](/docs/modules/parquet/api-reference/parquet-source-loader) provides reusable, selective Arrow reads with cached schema and footer metadata. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`ParquetDatasetSource`](/docs/modules/parquet/api-reference/parquet-source-loader#multi-file-datasets) coordinates catalog-backed, multi-file Parquet reads with file pruning and bounded concurrency. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- `ParquetJSLoader` and `ParquetJSWriter` provide experimental TypeScript parquetjs variants documented with [`ParquetLoader`](/docs/modules/parquet/api-reference/parquet-loader#loader-variants) and [`ParquetWriter`](/docs/modules/parquet/api-reference/parquet-writer#writer-variants). <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- `ParquetLoader` supports Arrow output with `parquet.shape: 'arrow-table'`, and `ParquetWriter` accepts loaders.gl Arrow tables.
- [`IcebergTableSource`](/docs/modules/parquet/api-reference/iceberg-table-source) provides read-only
  Iceberg metadata and manifest planning, dispatching selected Parquet files through the existing
  range-aware dataset reader.
- `DeltaSourceLoader` provides metadata-only loader discovery for read-only Delta snapshots.
  Import `DeltaTableSource` from the explicit `@loaders.gl/parquet/delta-source` subpath to replay
  newline-delimited transaction logs and dispatch active Parquet files through the same dataset
  reader.

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

# Attribution

- Based on a fork of https://github.com/ironSource/parquetjs and https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.).
- Delta decoder improvements include adaptations from https://github.com/hyparam/hyparquet under the MIT license (Copyright (c) Hyperparam contributors).
- Documentation was inspired by [parquet-go](https://github.com/xitongsys/parquet-go/blob/master/LICENSE) under Apache 2 license.

# License

`@loaders.gl/parquet` module is based on Apache 2.0 licensed code.
