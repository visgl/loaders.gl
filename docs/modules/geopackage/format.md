---
title: GeoPackage format
description: Read OGC GeoPackage vector tables from a portable SQLite container and expose them as geometry or Arrow data.
hide_title: true
page_style: designed
---

import {GeoPackageDocsTabs} from '@site/src/components/docs/geopackage-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geospatial container"
  title="A portable SQLite file for geospatial tables."
  description="GeoPackage combines OGC-defined metadata tables with SQLite storage for vector features, tiles, and related geospatial content. loaders.gl exposes the tables through common geometry and Arrow paths."
  tone="mint"
  meta={['OGC GeoPackage', 'SQLite container', 'Geometry and Arrow tables']}
  links={[
    {label: 'GeoPackage module', to: '/docs/modules/geopackage'},
    {label: 'GeoPackageLoader', to: '/docs/modules/geopackage/api-reference/geopackage-loader'},
    {label: 'Source API', to: '/docs/modules/geopackage/api-reference/geopackage-source'}
  ]}
/>

<GeoPackageDocsTabs active="format" />

<DocOrientation
  eyebrow="Portable geospatial data"
  title="Open the table you need, keep its metadata."
  description="A GeoPackage can contain several feature tables and the metadata that describes their geometry columns and coordinate systems. The loader turns a selected table into a shared application shape."
  tone="mint"
  items={[
    {label: 'Container', value: 'A single SQLite file with OGC metadata tables.'},
    {label: 'Discovery', value: 'Inspect tables, geometry columns, bounds, and CRS metadata.'},
    {label: 'Output', value: 'GeoJSON tables, WKB-backed geometry, or Arrow tables.'},
    {label: 'Source path', value: 'Read selected table data without treating the whole file as one row set.'}
  ]}
/>

<ReferenceBoundary
  title="GeoPackage format and API details"
  description="The reference below describes the SQLite container, OGC metadata, supported geometry encodings, and the loader/source boundaries."
  tone="mint"
/>

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
