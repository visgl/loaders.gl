import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# Parquet Format

<ParquetDocsTabs active="format" />

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
| Writer APIs          | `encode`, `encodeSync`                                                                     |

## Loaders and Writers

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
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>ParquetWriter</strong>
    <span>Writes loaders.gl tables as Parquet files.</span>
    <span className="docs-api-card__meta">Input: Table</span>
    <span className="docs-api-card__meta">APIs: encode, encodeSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-js-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>ParquetJSLoader</strong>
    <span>Loads Parquet files with the experimental parquetjs backend.</span>
    <span className="docs-api-card__meta">Output: ObjectRowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/parquet/api-reference/parquet-js-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>ParquetJSWriter</strong>
    <span>Writes Parquet files with the experimental parquetjs backend.</span>
    <span className="docs-api-card__meta">Input: Table</span>
    <span className="docs-api-card__meta">APIs: encode</span>
  </a>
</div>

## Encodings

Parquet stores data by column and groups values into row groups, column chunks, and pages. It supports per-column compression, repetition levels for nested data, and logical type annotations.

## GeoParquet

GeoParquet files are Parquet files with geospatial metadata in the schema and one or more geometry columns. See [GeoParquet](/docs/modules/parquet/formats/geoparquet) for the geospatial conventions supported by loaders.gl.
