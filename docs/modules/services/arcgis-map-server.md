---
title: ArcGIS MapServer
description: Load cached or dynamically rendered ArcGIS map tiles through one tile source.
hide_title: true
page_style: designed
---

import {ClientExample} from '@site/src/components';
import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Services module · ArcGIS tile source"
  title="ArcGIS MapServer"
  description="Load cached or dynamically rendered ArcGIS maps through one TileSource, with automatic mode selection, normalized LOD metadata, and shared credentials."
  tone="violet"
  meta={['MapServer', 'Cached or dynamic', 'TileSource']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'ArcGIS service API', to: '/docs/modules/services/api-reference/arcgis'},
    {label: 'Tiles module', to: '/docs/modules/tiles'}
  ]}
/>

<WmsDocsTabs active="arcgis-map-server" />

<ServiceSourceGraphic kind="arcgis" />

<DocOrientation
  eyebrow="What it provides"
  title="Use the same tile interface for two server modes."
  description="MapServer can expose a cache, a dynamic export endpoint, or both. The source normalizes those modes while keeping the choice explicit and configurable."
  tone="violet"
  items={[
    {label: 'Cached', value: 'Advertised tile matrix and tile URLs'},
    {label: 'Dynamic', value: 'Exported images for requested bounds'},
    {label: 'Grid', value: 'ArcGIS LODs normalized to tile metadata'},
    {label: 'Control', value: 'Mode, layers, format, time, and tokens'}
  ]}
/>

<ReferenceBoundary
  title="MapServer reference"
  description="The sections below cover support, authentication, cached tiles, dynamic exports, and source options."
  tone="violet"
/>

ArcGIS MapServer services expose cached map tiles, dynamically rendered maps, or both.
`ArcGISMapTileSourceLoader` presents either mode through one loaders.gl `TileSource`.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| Cached tile services | Supported | Uses `/tile/{z}/{y}/{x}` when service metadata advertises `tileInfo` |
| Dynamic map services | Supported | Uses `/export` with a Web Mercator tile bounding box |
| Automatic mode selection | Supported | `mode: 'auto'` chooses cached tiles when available, otherwise export |
| Explicit mode selection | Supported | Use `mode: 'cached'` or `mode: 'dynamic'` |
| Service metadata | Supported | `getMetadata()` exposes bounds, CRS, layers, tile size, and ArcGIS LODs |
| ArcGIS LOD grid | Supported | Advertised levels, origins, resolutions, and scale are normalized as a tile grid |
| Dynamic rendering parameters | Supported | Layer visibility, format, transparency, time, and vendor parameters are forwarded |
| Multiple service URLs | Supported | Optional URL pool distributes tile requests deterministically |
| Authentication | Supported | URL tokens and standard fetch options are preserved |
| Feature queries | Not provided | Use FeatureServer for vector queries or WMS `GetFeatureInfo` when available |
| deck.gl rendering | First class | `SourceLayer` consumes the `TileSource` directly |

## Authentication

`createArcGISCredential` applies one exact-origin token to metadata, cached tiles, and dynamic
exports, including requests issued through `SourceLayer`. Explicit URL tokens take precedence. See
the [authentication guide](/docs/developer-guide/authentication).

## Cached tiles

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISMapTileSourceLoader} from '@loaders.gl/services';

const source = createDataSource(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
  [ArcGISMapTileSourceLoader]
);

const metadata = await source.getMetadata();
const image = await source.getTile({x: 2, y: 1, z: 2});
```

## Dynamic export tiles

Select export mode when a service is not cached or when dynamic layer, time, or rendering
parameters are required:

```ts
const source = createDataSource(mapServerUrl, [ArcGISMapTileSourceLoader], {
  'arcgis-map-server': {
    mode: 'dynamic',
    tileSize: 512,
    urls: ['https://tiles-a.example.com/MapServer', 'https://tiles-b.example.com/MapServer'],
    exportParameters: {
      layers: 'show:0,2',
      format: 'png32',
      transparent: true
    }
  }
});

source.updateParameters({time: '2024-01-01'});
```

Runtime parameters are merged into subsequent export requests, which makes time sliders and layer
controls inexpensive to implement.

## deck.gl integration

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const layer = new SourceLayer({
  id: 'world-imagery',
  data: mapServerUrl,
  loaders: SERVICE_LOADERS,
  minZoom: 0,
  maxZoom: 19
});
```

`SourceLayer` uses the normalized tile grid and requests only visible tiles.

## Live example

<div style={{height: '520px'}}>
  <ClientExample kind="wms" format="ArcGIS MapServer" />
</div>

## References

- [ArcGIS REST API Map Service](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/)
- [ArcGIS REST API Export Map](https://developers.arcgis.com/rest/services-reference/enterprise/export-map/)
