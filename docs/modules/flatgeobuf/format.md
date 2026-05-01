import {FlatGeobufDocsTabs} from '@site/src/components/docs/flatgeobuf-docs-tabs';

# FlatGeobuf Format

<FlatGeobufDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [FlatGeobuf](/docs/modules/flatgeobuf/formats/flatgeobuf)                                  |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), Arrow tables, binary features         |
| File Extension       | `.fgb`                                                                                     |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary                                                                                     |
| Loader APIs          | `load`, `loadInBatches`, `parse`, `parseSync`, `parseInBatches`                            |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |
| Source APIs          | `createDataSource`, `getMetadata`, `getSchema`, `getFeatures`                              |

## Loaders and Sources

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/flatgeobuf/api-reference/flatgeobuf-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>FlatGeobufLoader</strong>
    <span>Loads FlatGeobuf files as GeoJSON, Arrow, columnar, or binary geometry data.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ArrowTable, ColumnarTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/flatgeobuf/api-reference/flatgeobuf-source-loader">
    <span className="docs-api-card__kind">Source</span>
    <strong>FlatGeobufSourceLoader</strong>
    <span>Creates an indexed vector source for remote FlatGeobuf datasets.</span>
    <span className="docs-api-card__meta">Output: VectorSource</span>
    <span className="docs-api-card__meta">APIs: createDataSource, getFeatures</span>
  </a>
</div>

## Spatial Indexes

FlatGeobuf files can include a packed spatial index for range-request access. `FlatGeobufSourceLoader` uses that index when present to fetch viewport-sized feature subsets from remote files.

## Arrow

Set `flatgeobuf.shape: 'arrow-table'` to preserve FlatGeobuf property columns in an Arrow table and append a WKB `geometry` column with geospatial metadata.
