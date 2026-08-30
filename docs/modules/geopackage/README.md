---
title: '@loaders.gl/geopackage'
description: Read GeoPackage layers and tables through loader and source APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DatasetDiscoveryGraphic} from '@site/src/components/docs/dataset-discovery-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="Geospatial database module"
  title="@loaders.gl/geopackage"
  description="GeoPackage is a SQLite-based container for vector features, tiles, and metadata. The module exposes its tables and layers directly, with a source path for discovering and reading selected data."
  tone="orange"
  logos={[{alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}]}
  meta={['OGC GeoPackage', 'SQLite', 'Layer and table access']}
  links={[
    {label: 'GeoPackage format', to: '/docs/modules/geopackage/formats/geopackage'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<DocLiveExample label="GeoPackage map example" height="440px">
  <ClientExample kind="geospatial" format="GeoPackage" />
</DocLiveExample>

<DatasetDiscoveryGraphic kind="geopackage" />

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
