---
title: ArcGIS VectorTileServer
description: Load ArcGIS vector tiles, style metadata, and tile grids through a vector-tile source.
hide_title: true
page_style: designed
---

import {ClientExample} from '@site/src/components';
import {ArcGISDocsTabs} from '@site/src/components/docs/arcgis-docs-tabs';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="ArcGIS module · ArcGIS vector-tile source"
  title="ArcGIS VectorTileServer"
  description="Load ArcGIS vector tiles together with their tile grid, style, and sprite metadata, then expose raw or decoded MVT data to the application."
  tone="violet"
  logos={[{alt: 'ArcGIS', src: '/images/format-logos/arcgis-logo.svg'}]}
  meta={['VectorTileServer', 'MVT and styles', 'VectorTileSource']}
  links={[
    {label: 'ArcGIS module', to: '/docs/modules/arcgis'},
    {label: 'ArcGIS service API', to: '/docs/modules/arcgis/api-reference/arcgis'},
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'}
  ]}
/>

<DocLiveExample label="ArcGIS VectorTileServer example" height="440px">
  <ClientExample kind="wms" format="ArcGIS VectorTileServer" />
</DocLiveExample>

<ArcGISDocsTabs service="arcgis-vector-tile-server" />

<ServiceSourceGraphic kind="arcgis" />

<DocOrientation
  eyebrow="What it provides"
  title="Keep tile bytes, decoded features, and style metadata connected."
  description="The source exposes the raw PBF payload for low-level consumers and a decoded MVT path for map applications, while preserving ArcGIS’s published grid and style resources."
  tone="violet"
  items={[
    {label: 'Metadata', value: 'Extent, CRS, LOD grid, and style URLs'},
    {label: 'Raw', value: 'Original vector-tile PBF bytes'},
    {label: 'Decoded', value: 'MVT features in application coordinates'},
    {label: 'Resources', value: 'Styles, sprites, and authentication'}
  ]}
/>

<ReferenceBoundary
  title="VectorTileServer reference"
  description="The sections below cover support, authentication, raw and decoded tiles, styles, and source options."
  tone="violet"
/>

ArcGIS VectorTileServer endpoints publish Mapbox Vector Tile (MVT) data together with an ArcGIS
tile grid, style document, and sprite resources. `ArcGISVectorTileServerSourceLoader` implements the
loaders.gl `VectorTileSource` contract.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| Service metadata | Supported | `getMetadata()` exposes extent, CRS, LOD grid, style URL, and sprite URL |
| Raw vector tiles | Supported | `getTile()` returns the original PBF bytes |
| Decoded vector tiles | Supported | `getVectorTile()` decodes MVT through `@loaders.gl/mvt` |
| deck.gl tile data | Supported | `getTileData()` returns decoded WGS84 feature data |
| Geometry coordinates | WGS84 | Decoded features are transformed from tile-local coordinates for visualization |
| Layer filtering | Supported | Forward MVT loader options to select named source layers |
| Feature shape | Configurable | Standard MVT loader shape options are honored |
| ArcGIS style discovery | Supported | Metadata includes the published root style and sprite resource URLs |
| Style application | Application controlled | loaders.gl exposes style resources but does not translate the full ArcGIS style into deck props |
| Authentication | Supported | URL tokens and standard fetch options are preserved for all resources |
| deck.gl rendering | First class | `SourceLayer` consumes decoded vector tiles directly |

## Authentication

`createArcGISCredential` applies an exact-origin token to metadata and tile requests made by this source. Explicit URL tokens take precedence. See the
[authentication guide](/docs/developer-guide/authentication).

## Raw and decoded tiles

```ts
import {load} from '@loaders.gl/core';
import {ArcGISVectorTileServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader]);

const metadata = await source.getMetadata();
const tileBytes = await source.getTile({z: 4, x: 6, y: 7});
const features = await source.getVectorTile({z: 4, x: 6, y: 7});
```

Use `getTile` when caching or forwarding the original PBF. Use `getVectorTile` when an application
needs decoded geometries and properties.

## Decoder options

MVT options are forwarded to `@loaders.gl/mvt`:

```ts
const source = await load(vectorTileServiceUrl, [ArcGISVectorTileServerSourceLoader], {
  mvt: {
    shape: 'geojson-table',
    layers: ['roads', 'labels']
  }
});
```

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';

const layer = new SourceLayer({
  id: 'arcgis-vector-tiles',
  data: vectorTileServiceUrl,
  loaders: ARCGIS_LOADERS,
  extent: [-180, -85.051129, 180, 85.051129],
  pickable: true,
  getFillColor: [60, 140, 210],
  getLineColor: [20, 50, 80]
});
```

The ArcGIS style URL remains available in source metadata for applications that want to translate
or selectively reuse the service's authored style.

## References

- [ArcGIS REST API Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
