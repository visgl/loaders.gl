import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# Arrow Format

<ArrowDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Apache Arrow](/docs/modules/arrow/formats/arrow)                                          |
| Related Format       | [GeoArrow](/docs/modules/arrow/formats/geoarrow)                                           |
| Data Format          | [Tables](/docs/specifications/category-table), [Geometry Tables](/docs/specifications/category-gis) |
| File Extensions      | `.arrow`, `.feather`                                                                       |
| MIME Types           | `application/vnd.apache.arrow.file`, `application/vnd.apache.arrow.stream`                  |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                             |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |
| Writer APIs          | `encodeSync`                                                                               |

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/arrow-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>ArrowLoader</strong>
    <span>Loads Apache Arrow IPC files and streams as loaders.gl tables.</span>
    <span className="docs-api-card__meta">Output: ArrowTable, table shapes</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/geoarrow-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GeoArrowLoader</strong>
    <span>Loads Arrow data and interprets GeoArrow geometry columns.</span>
    <span className="docs-api-card__meta">Output: Geometry table</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/arrow/api-reference/arrow-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>ArrowWriter</strong>
    <span>Writes arrays as Apache Arrow IPC data.</span>
    <span className="docs-api-card__meta">Input: arrays</span>
    <span className="docs-api-card__meta">APIs: encodeSync</span>
  </a>
</div>

## IPC

`ArrowLoader` reads Apache Arrow IPC file and stream data. IPC streams can be parsed in batches with `parseInBatches`.

## GeoArrow

GeoArrow data is valid Apache Arrow data with geospatial extension metadata and geometry column layouts. Use `GeoArrowLoader` when you want loaders.gl to interpret GeoArrow geometry columns.
