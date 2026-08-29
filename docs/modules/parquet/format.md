---
title: Apache Parquet format
description: Read and write compressed columnar files, with selective access and GeoParquet metadata for cloud datasets.
hide_title: true
page_style: designed
---

import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Columnar file format"
  title="Read the columns the application actually needs."
  description="Parquet stores typed columns in independently addressable pages. loaders.gl combines its format reader with Arrow output, metadata-first sources, range requests, and GeoParquet conventions for cloud-friendly data access."
  tone="orange"
  meta={['Column and page pruning', 'Arrow output', 'GeoParquet metadata']}
  links={[
    {label: 'Parquet overview', to: '/docs/modules/parquet/formats/parquet'},
    {label: 'ParquetLoader', to: '/docs/modules/parquet/api-reference/parquet-loader'},
    {label: 'Selective reads', to: '/docs/modules/parquet/api-reference/parquet-source-loader'}
  ]}
/>

<ParquetDocsTabs active="format" />

<DocOrientation
  eyebrow="Cloud data path"
  title="Metadata first, bytes second."
  description="A Parquet application can inspect the footer and schema before reading all columns. That makes projection, predicate filtering, and spatial selection practical even when the file lives behind range requests."
  tone="orange"
  items={[
    {label: 'Inspect', value: 'Read schema, footer, statistics, and GeoParquet metadata.'},
    {label: 'Select', value: 'Choose columns, row groups, pages, and optional predicates.'},
    {label: 'Decode', value: 'Return object rows or Arrow tables with typed columns.'},
    {label: 'Write', value: 'Encode compatible tables back to Parquet or GeoParquet.'}
  ]}
/>

<ReferenceBoundary
  title="Parquet module details"
  description="The reference below compares loaders, sources, writers, output shapes, streaming behavior, and the options that govern selective reads."
  tone="orange"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Apache Parquet](/docs/modules/parquet/formats/parquet), [GeoParquet](/docs/modules/parquet/formats/geoparquet) |
| Data Format          | [Tables](/docs/specifications/category-table), [Geometry Tables](/docs/specifications/category-gis) |
| File Extension       | `.parquet`                                                                                 |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseInBatches`                                                          |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | Yes                                                                                        |
| Source APIs          | `createDataSource`, `getMetadata`, `getSchema`, `read`, `close`                            |
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders, Sources and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>ParquetLoader</strong>
    <span>Loads Parquet files as object-row tables or Arrow tables.</span>
    <span className="docs-api-card__meta">Output: ObjectRowTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/geoparquet-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GeoParquetLoader</strong>
    <span>Loads GeoParquet files as GeoJSON tables or Arrow tables with geospatial metadata.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-source-loader">
    <span className="docs-api-card__kind">Source</span>
    <strong>ParquetSourceLoader</strong>
    <span>Reuses cached schema and footer metadata for selective Arrow reads.</span>
    <span className="docs-api-card__meta">Output: ArrowTableBatch</span>
    <span className="docs-api-card__meta">APIs: createDataSource, getMetadata, getSchema, read</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>ParquetWriter</strong>
    <span>Writes loaders.gl tables as Parquet files.</span>
    <span className="docs-api-card__meta">Input: Table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
</div>

## Encodings

Parquet stores data by column and groups values into row groups, column chunks, and pages. It supports per-column compression, repetition levels for nested data, and logical type annotations.

## GeoParquet

GeoParquet files are Parquet files with geospatial metadata in the schema and one or more geometry columns. See [GeoParquet](/docs/modules/parquet/formats/geoparquet) for the geospatial conventions supported by loaders.gl.
