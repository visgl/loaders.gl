---
title: Shapefile format
description: Read the geometry, attributes, indexes, projection, and encoding that make up a Shapefile dataset.
hide_title: true
page_style: designed
---

import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GIS dataset format"
  title="A geospatial dataset, not just a .shp file."
  description="A Shapefile is a coordinated set of geometry, attribute, index, projection, and text-encoding files. loaders.gl assembles those pieces into common GIS and Arrow data shapes."
  tone="orange"
  meta={['SHP + sidecars', 'Geometry and attributes', 'CRS metadata']}
  links={[
    {label: 'Shapefile module', to: '/docs/modules/shapefile'},
    {label: 'ShapefileLoader', to: '/docs/modules/shapefile/api-reference/shapefile-loader'},
    {label: 'GIS category', to: '/docs/specifications/category-gis'}
  ]}
/>

<ShapefileDocsTabs active="format" />

<DocOrientation
  eyebrow="The dataset boundary"
  title="Keep geometry and sidecars together."
  description="The main geometry file is only one part of the format. The loader coordinates the sidecars so application code can work with features, attributes, and spatial metadata as one result."
  tone="orange"
  items={[
    {label: 'Geometry', value: '.shp stores the shape records'},
    {label: 'Attributes', value: '.dbf stores the tabular properties'},
    {label: 'Index and CRS', value: '.shx indexes records; .prj describes projection'},
    {label: 'Text encoding', value: '.cpg can identify DBF character encoding'}
  ]}
/>

<ReferenceBoundary
  title="Shapefile structure and loaders"
  description="The reference below covers the file set, loaders, Arrow output, sidecar behavior, and compatibility details."
  tone="orange"
/>

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
