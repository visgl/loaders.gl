---
title: '@loaders.gl/services'
description: Framework-independent sources for ArcGIS REST services and cloud-hosted geographic data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Service sources"
  title="@loaders.gl/services"
  description="Treat remote service endpoints like other loaders.gl sources: discover capabilities, request only what is needed, and hand results to the application or renderer."
  tone="orange"
  meta={['ArcGIS REST', 'Vector, raster, and tiles', 'Source contracts']}
  links={[
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Service catalog', to: '/docs'}
  ]}
/>

The `@loaders.gl/services` module provides framework-independent sources for ArcGIS REST services.
The sources use the same loaders.gl contracts as file loaders: they can be selected by `load`,
created with `createDataSource`, and rendered through deck.gl's generic `SourceLayer`.

OGC protocols such as WMS, WMTS, WFS, WCS, CSW, GML, and OGC API remain in
[`@loaders.gl/wms`](/docs/modules/wms). Keeping the protocol implementations in their owning
modules lets applications install only the service families they use.

<DocOrientation
  eyebrow="The service path"
  title="Treat remote services like data sources."
  description="Discover the endpoint, request the useful subset, and hand the result to application code or a renderer without coupling that code to one service vendor."
  tone="orange"
  items={[
    {label: 'Discover', value: 'Identify service capabilities and available layers'},
    {label: 'Request', value: 'Ask for features, images, tiles, or scene content'},
    {label: 'Normalize', value: 'Use vector, raster, tile, or tileset source contracts'},
    {label: 'Render', value: 'Connect visual results to deck.gl SourceLayer when useful'}
  ]}
/>

<ReferenceBoundary
  title="Service sources and integration details"
  description="The reference below covers supported ArcGIS services, installation, source construction, authentication, capability discovery, and deck.gl integration."
  tone="orange"
/>

## Service support

| Service | Source loader | Runtime contract | Primary output | deck.gl | Documentation |
| --- | --- | --- | --- | --- | --- |
| ArcGIS FeatureServer | `ArcGISFeatureServerSourceLoader` | `VectorSource` | GeoJSON, binary or Arrow features | `SourceLayer` | [FeatureServer](/docs/modules/services/arcgis-feature-server) |
| ArcGIS ImageServer | `ArcGISImageServerSourceLoader` | `ImageSource` | Rendered image or decoded LERC raster | `SourceLayer` for rendered images | [ImageServer](/docs/modules/services/arcgis-image-server) |
| ArcGIS ImageServer tiles | `ArcGISImageTileSourceLoader` | `TileSource` | Image tiles or decoded LERC tiles | `SourceLayer` for image tiles | [ImageServer](/docs/modules/services/arcgis-image-server) |
| ArcGIS MapServer | `ArcGISMapTileSourceLoader` | `TileSource` | Cached or dynamically exported image tiles | `SourceLayer` | [MapServer](/docs/modules/services/arcgis-map-server) |
| ArcGIS VectorTileServer | `ArcGISVectorTileServerSourceLoader` | `VectorTileSource` | Raw MVT or decoded WGS84 features | `SourceLayer` | [VectorTileServer](/docs/modules/services/arcgis-vector-tile-server) |
| ArcGIS SceneServer | `ArcGISSceneServerSourceLoader` | `Tileset3DSource` or `PointCloudTilesetSource` | I3S mesh, Point, or Point Cloud tiles | Application-specific 3D renderer | [SceneServer](/docs/modules/services/arcgis-scene-server) |
| ArcGIS service directory | Capability graph utilities | Discovery graph | Ranked service endpoints | Not directly visual | [Capability discovery](#capability-discovery) |

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/services
```

Install `@loaders.gl/deck-layers` and deck.gl when a service should be rendered directly.

## One registry, three entry points

`SERVICE_LOADERS` is the recommended registry for applications that may receive more than one
ArcGIS service type. URL detection handles conventional ArcGIS REST endpoint names. Use
`core.type` when a proxy or rewritten URL hides the service type.

### Load a service

For a `SourceLoader`, `load` returns a source object rather than downloading an entire service:

```ts
import {load} from '@loaders.gl/core';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const source = await load(serviceUrl, SERVICE_LOADERS);
const metadata = await source.getMetadata();
```

### Create a typed source

Use `createDataSource` when the application already knows the service type:

```ts
import {createDataSource} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/services';

const source = createDataSource(serviceUrl, [ArcGISFeatureServerSourceLoader]);
const features = await source.getFeatures({
  layers: ['0'],
  boundingBox: [[-123, 37], [-121, 39]]
});
```

### Render through deck.gl

`SourceLayer` resolves the source and dispatches it to the appropriate image, vector, image-tile,
or vector-tile renderer. No ArcGIS-specific deck.gl layer is required.

```ts
import {SourceLayer} from '@loaders.gl/deck-layers';
import {SERVICE_LOADERS} from '@loaders.gl/services';

const layer = new SourceLayer({
  id: 'city-service',
  data: serviceUrl,
  loaders: SERVICE_LOADERS,
  layers: ['0'],
  pickable: true
});
```

`SourceLayer` is intended for visual sources. Catalogs and analytical LERC rasters remain data
objects until the application chooses a record, band, color ramp, and NoData treatment.

## Authentication and request customization

Use `createArcGISCredential` to scope a token to the exact ArcGIS Online, Enterprise, or proxy
origin. The credential follows metadata, feature, image, tile, and deck.gl requests:

```ts
import {createArcGISCredential} from '@loaders.gl/services';

const source = await load(serviceUrl, SERVICE_LOADERS, {
  core: {
    credentials: [
      createArcGISCredential({origins: [new URL(serviceUrl).origin], token})
    ]
  }
});
```

ArcGIS tokens already present in a service URL are preserved and take precedence. Bearer headers,
cookies, cancellation, proxies, and custom transports continue to use standard loaders.gl fetch
options. Async token callbacks support one deduplicated refresh after 401, 403, 498, or 499.
See the [authentication guide](/docs/developer-guide/authentication) for the common model and
security boundaries.

Service-specific options can add ArcGIS request parameters without bypassing the source API. See
the individual service pages for the supported option names.

## Capability discovery

Applications can discover an ArcGIS REST directory and rank its services by kind, format, and
coordinate system. Discovery is optional: direct source construction is simpler when the endpoint
is already known.

```ts
import {
  SERVICE_LOADERS,
  discoverArcGISCapabilities,
  selectArcGISService
} from '@loaders.gl/services';
import {createDataSource} from '@loaders.gl/core';

const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services');
const imagery = graph && selectArcGISService(graph, {kind: 'image', format: 'lerc'});
const source = imagery && createDataSource(imagery.url, SERVICE_LOADERS, {
  core: {type: imagery.capabilities.type}
});
```

Discovery performs one metadata request per discovered service. Pass a custom `fetch` function
when using authentication, a proxy, or a test transport.

## SceneServer layers

`ArcGISSceneServerSource` provides a thin service facade for explicit I3S SceneServer layer
endpoints. It normalizes layer metadata and delegates traversal and decoding to the existing I3S
mesh, Point, or Point Cloud source.

```ts
import {ArcGISSceneServerSource} from '@loaders.gl/services';
import {coreApi} from '@loaders.gl/core';

const service = new ArcGISSceneServerSource(
  'https://example.com/arcgis/rest/services/City/SceneServer/layers/0',
  {'arcgis-scene-server': {token: 'secret'}},
  coreApi
);

const metadata = await service.getMetadata();
const tilesetSource = await service.getTilesetSource();
```

For a URL ending at `/SceneServer`, provide `arcgis-scene-server.layerId`. Mesh, Point, and Point
Cloud profiles are selected automatically.

The facade also exposes `query(options)` / `getFeatures(options)` for read-only SceneServer layer
queries and preserves the raw response metadata. Use `aggregateArcGISSceneFeatures` for local
group-by and numeric aggregation. Renderer and popup expressions are preserved as metadata and
remain the responsibility of the consuming renderer.

## Choosing a service

| Need | Recommended source |
| --- | --- |
| Query individual vector features and properties | FeatureServer |
| Display server-rendered analytical imagery | ImageServer |
| Analyze pixel values, bands, masks, or statistics | ImageServer with LERC |
| Display a cached ArcGIS basemap | MapServer |
| Display a dynamic MapServer as tiles | MapServer in `dynamic` mode |
| Decode and style ArcGIS-hosted vector tiles | VectorTileServer |
| Select among many ArcGIS endpoints | Capability discovery, then a concrete source |

## Design boundaries

- Sources are read-only clients. Editing, transactions, and administrative ArcGIS APIs are out of
  scope.
- Service metadata is normalized for cross-provider use while provider-specific metadata remains
  available from the concrete source.
- Reprojection-aware metadata and tile grids are exposed, but loaders.gl does not silently resample
  analytical raster values.
- LERC decoding preserves typed arrays, masks, NoData values, and statistics. Visualization remains
  explicit because a scientifically correct color mapping is application-specific.
