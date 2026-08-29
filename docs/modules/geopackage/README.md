---
title: '@loaders.gl/geopackage'
description: Read GeoPackage layers and tables through loader and source APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geospatial database module"
  title="Open a GeoPackage without hiding its layers."
  description="GeoPackage is a SQLite-based container for vector features, tiles, and metadata. The module exposes its tables and layers directly, with a source path for discovering and reading selected data."
  tone="orange"
  meta={['OGC GeoPackage', 'SQLite', 'Layer and table access']}
  links={[
    {label: 'GeoPackage format', to: '/docs/modules/geopackage/formats/geopackage'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<DocOrientation
  eyebrow="The GeoPackage path"
  title="Discover the container, then choose the layer."
  description="A GeoPackage can hold several tables and geometry layers. The loader preserves that organization so applications can select the data they need instead of treating the file as one opaque payload."
  tone="orange"
  items={[
    {label: 'Container', value: 'SQLite database with OGC-defined tables'},
    {label: 'Discovery', value: 'Layers, columns, geometry types, and metadata'},
    {label: 'Output', value: 'Feature tables or source-backed reads'},
    {label: 'Runtime', value: 'Local parsing with explicit CRS and layer information'}
  ]}
/>

![ogc-logo](../../images/logos/ogc-logo-60.png)

<ReferenceBoundary
  title="GeoPackage module details"
  description="The sections below cover installation, loaders, sources, layers, tables, and attribution."
  tone="orange"
/>

The `@loaders.gl/geopackage` module handles the OGC [GeoPackage](https://www.geopackage.org/) format.

## Installation

```bash
npm install @loaders.gl/geopackage
```

## Loaders and Writers

| Loader / Source | Description |
| --------------- | ----------- |
| [`GeoPackageLoader`](/docs/modules/geopackage/api-reference/geopackage-loader) | Loads GeoPackage files and exposes their tables and layers. |
| [`GeoPackageSource`](/docs/modules/geopackage/api-reference/geopackage-source) | Provides access to GeoPackage tables as a data source. |

## Attribution

The GeoPackage loaders and source use [SQL.js](https://sql.js.org/) under the MIT license.
