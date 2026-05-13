import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';

# Shapefile Format

<ShapefileDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [Shapefile](/docs/modules/shapefile/formats/shapefile)                                     |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), Arrow tables                          |
| File Extensions      | `.shp`, `.shx`, `.dbf`, `.prj`, `.cpg`                                                     |
| MIME Type            | `application/octet-stream`                                                                 |
| File Type            | Binary, multi-file                                                                         |
| Loader APIs          | `load`, `parse`, `parseSync`, `parseInBatches`                                             |
| Loader Worker Thread | Yes                                                                                        |
| Loader Streaming     | Yes                                                                                        |

## Loaders

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/shapefile/api-reference/shapefile-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>ShapefileLoader</strong>
    <span>Loads Shapefile geometries and DBF properties as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ArrowTable, legacy Shapefile output</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/shapefile/api-reference/shp-loader">
    <span className="docs-api-card__kind">Subloader</span>
    <strong>SHPLoader</strong>
    <span>Loads the `.shp` geometry component of a Shapefile.</span>
    <span className="docs-api-card__meta">Output: geometry records</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/shapefile/api-reference/dbf-loader">
    <span className="docs-api-card__kind">Subloader</span>
    <strong>DBFLoader</strong>
    <span>Loads the `.dbf` attribute table component of a Shapefile.</span>
    <span className="docs-api-card__meta">Output: object rows</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseSync</span>
  </a>
</div>

## Multi-File Datasets

A Shapefile dataset is normally a set of sidecar files. `.shp` stores geometry, `.dbf` stores attributes, `.shx` stores the index, `.prj` stores projection text, and `.cpg` stores DBF text encoding.

## Arrow

Set `shapefile.shape: 'arrow-table'` to return an Arrow table with DBF property columns and a WKB `geometry` column.
