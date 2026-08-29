---
title: ArcGIS service API reference
description: The loaders.gl source contracts for ArcGIS feature, image, vector-tile, and scene services.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Services module · ArcGIS"
  title="ArcGIS service sources"
  description="ArcGIS publishes several service families. loaders.gl maps the useful endpoint contracts onto sources for vectors, images, tiles, and scenes, with deterministic discovery and shared authentication."
  tone="violet"
  meta={['FeatureServer', 'ImageServer', 'MapServer and SceneServer']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'Service sources', to: '/docs/developer-guide/using-sources'},
    {label: 'ArcGIS sources', to: '/docs/modules/services/arcgis-feature-server'}
  ]}
/>

<DocOrientation
  eyebrow="The ArcGIS boundary"
  title="One service family, several data contracts."
  description="Select the source contract that matches the endpoint: vector features, imagery, cached tiles, vector tiles, or 3D scene content."
  tone="violet"
  items={[
    {label: 'Features', value: 'FeatureServer to vector and table data'},
    {label: 'Imagery', value: 'ImageServer to images or raster data'},
    {label: 'Tiles', value: 'MapServer and VectorTileServer sources'},
    {label: 'Scenes', value: 'SceneServer to I3S and point-cloud sources'}
  ]}
/>

<ReferenceBoundary
  title="ArcGIS service reference"
  description="The tables below map endpoint families to source contracts, discovery helpers, and provider-specific references."
  tone="violet"
/>

ArcGIS Server directories can publish several endpoint families. loaders.gl v5 keeps one small
source loader per visual data contract and a shared registry for automatic selection.

| Loader type | ArcGIS endpoint | Source contract | Primary methods | Output |
| --- | --- | --- | --- | --- |
| `arcgis-feature-server` | `FeatureServer` | `VectorSource` | `getMetadata`, `getSchema`, `getFeatures` | GeoJSON, binary, Arrow |
| `arcgis-image-server` | `ImageServer` | `ImageSource` | `getMetadata`, `getImage`, `exportImage`, `exportRaster` | Image or LERC raster |
| `arcgis-image-server-tiles` | `ImageServer` | `TileSource` | `getMetadata`, `getTile`, `updateParameters` | Image or LERC tile |
| `arcgis-map-server` | `MapServer` | `TileSource` | `getMetadata`, `getTile`, `updateParameters` | Cached or exported image tile |
| `arcgis-vector-tile-server` | `VectorTileServer` | `VectorTileSource` | `getMetadata`, `getTile`, `getVectorTile` | PBF or decoded vector tile |
| `arcgis-scene-server` | `SceneServer` | `Tileset3DSource` or `PointCloudTilesetSource` | `getMetadata`, `getTilesetSource` | I3S mesh, Point, or Point Cloud source |

`SERVICE_LOADERS` contains these loaders in deterministic selection order. Pass it to `load`,
`createDataSource`, or deck.gl's `SourceLayer`:

```ts
import {load} from '@loaders.gl/core';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const source = await load(serviceUrl, SERVICE_LOADERS);
```

When endpoint rewriting hides `FeatureServer`, `ImageServer`, `MapServer`, `VectorTileServer`, or
`SceneServer`
from the URL, specify the table's loader type through `core.type`.

## Exported classes

| Source class | Source loader | Documentation |
| --- | --- | --- |
| `ArcGISVectorSource` | `ArcGISFeatureServerSourceLoader` | [FeatureServer](../arcgis-feature-server) |
| `ArcGISImageSource` | `ArcGISImageServerSourceLoader` | [ImageServer](../arcgis-image-server) |
| `ArcGISImageTileSource` | `ArcGISImageTileSourceLoader` | [ImageServer tiles](../arcgis-image-server#image-tiles) |
| `ArcGISMapTileSource` | `ArcGISMapTileSourceLoader` | [MapServer](../arcgis-map-server) |
| `ArcGISVectorTileServerSource` | `ArcGISVectorTileServerSourceLoader` | [VectorTileServer](../arcgis-vector-tile-server) |
| `ArcGISSceneServerSource` | `ArcGISSceneServerSourceLoader` | [SceneServer](../arcgis-scene-server) |

## Discovery exports

`getArcGISServices()` reads an ArcGIS REST services directory.
`discoverArcGISCapabilities()` enriches discovered endpoints with normalized service capabilities,
and `selectArcGISService()` ranks them for an application requirement.

Provider-neutral metadata is intentionally smaller than each ArcGIS metadata document. Concrete
sources retain access to provider-specific metadata and request controls where those details are
needed.

## Excluded endpoint families

Geocoding, routing, geoprocessing, editing, administration, and portal content APIs are not part of
the v5 service source foundation.

## ArcGIS references

- [Feature Service](https://developers.arcgis.com/rest/services-reference/enterprise/feature-service/)
- [Image Service](https://developers.arcgis.com/rest/services-reference/enterprise/image-service/)
- [Map Service](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
- [Vector Tile Service](https://developers.arcgis.com/rest/services-reference/enterprise/vector-tile-service/)
