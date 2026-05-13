import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';

# GeoPackage Format

<GeoPackageDocsTabs active="format" />

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Format          | [GeoPackage](/docs/modules/geopackage/formats/geopackage)                                  |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), Arrow tables                          |
| File Extension       | `.gpkg`                                                                                    |
| MIME Type            | `application/geopackage+sqlite3`                                                           |
| File Type            | Binary SQLite database                                                                     |
| Loader APIs          | `load`, `parse`                                                                            |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | No                                                                                         |
| Source APIs          | `createDataSource`, `getMetadata`, `getTable`                                               |

## Loaders and Sources

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/geopackage/api-reference/geopackage-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GeoPackageLoader</strong>
    <span>Loads GeoPackage vector tables as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: Tables&lt;GeoJSONTable&gt;, GeoJSONTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/geopackage/api-reference/geopackage-source">
    <span className="docs-api-card__kind">Source</span>
    <strong>GeoPackageSource</strong>
    <span>Exposes GeoPackage table metadata and one-table Arrow reads.</span>
    <span className="docs-api-card__meta">Output: ArrowTable</span>
    <span className="docs-api-card__meta">APIs: createDataSource, getMetadata, getTable</span>
  </a>
</div>

## SQLite Container

GeoPackage stores geospatial data in a SQLite database with OGC-defined metadata tables. loaders.gl reads vector feature tables and converts geometries into GeoJSON or WKB-backed Arrow output.

## Arrow

Set `geopackage.shape: 'arrow-table'` and specify `geopackage.table` to load one vector table as an Arrow table with a WKB `geometry` column.
