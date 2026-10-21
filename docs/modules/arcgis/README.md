---
title: '@loaders.gl/arcgis'
description: Connect your existing ArcGIS Online and Enterprise layers to JavaScript applications.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  format="arcgis"
  eyebrow="Service sources"
  title="@loaders.gl/arcgis"
  description="Use layers already published in ArcGIS Online or Enterprise in your own application. Connect to the service, authorize access, and request features, imagery, tiles, or scenes without exporting your data."
  tone="orange"
  meta={['ArcGIS REST', 'Vector, raster, and tiles', 'Source contracts']}
  links={[
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Service inventory', to: '/docs/modules/arcgis/services'}
  ]}
/>

<DocLiveExample label="ArcGIS feature service example" height="440px">
  <ClientExample kind="wms" format="ArcGIS Feature Server" />
</DocLiveExample>

<ServiceSourceGraphic kind="arcgis" />

If your data is already in ArcGIS, start with its item page or REST service URL. You can query a
feature layer, display a published map, read imagery values, or connect to vector tiles and scenes.
Your data stays in ArcGIS; loaders.gl reads the subset your application requests.

Use async `load()` to create a source. Feature, image and tile sources can feed deck.gl's
`SourceLayer`; SceneServer needs a compatible I3S rendering path. Existing ArcGIS sharing and
service permissions continue to apply.

OGC protocols such as WMS, WMTS, WFS, WCS, CSW, GML, and OGC API remain in
[`@loaders.gl/services/wms`](/docs/modules/services/wms). Keeping the protocol implementations in their owning
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

Read the [ArcGIS developer guide](/docs/developer-guide/arcgis),
[authentication recipes](/docs/developer-guide/arcgis/authentication), and
[examples gallery](/examples/arcgis). The [complete service inventory](/docs/modules/arcgis/services)
includes unsupported operations and service families.

The root exports lightweight service loaders. Authentication and discovery have dedicated
`/authentication` and `/discovery` entrypoints. Async `load()`
imports the selected implementation. For synchronous `createDataSource()` or direct source
classes, use `@loaders.gl/arcgis/bundled`; see
[import patterns](/docs/developer-guide/arcgis#how-imports-work).

## Start with your published data

| What you already have | Choose this path | Protocol and feature card |
| --- | --- | --- |
| A hosted feature layer, layer view, or queryable table | Copy the layer REST URL and query features | [FeatureServer](/docs/modules/arcgis/formats/arcgis-feature-server) |
| A tiled map or map image layer | Read its cache or request server-rendered map images | [MapServer](/docs/modules/arcgis/formats/arcgis-map-server) |
| An imagery layer | Choose rendered imagery or numerical LERC pixels; tile exports are a separate source | [ImageServer](/docs/modules/arcgis/formats/arcgis-image-server) |
| A vector tile layer | Read MVT tiles and apply your application's styling | [VectorTileServer](/docs/modules/arcgis/formats/arcgis-vector-tile-server) |
| A scene layer | Choose an explicit scene layer and inspect its I3S profile | [SceneServer](/docs/modules/arcgis/formats/arcgis-scene-server) |
| An item ID or an item page URL | [Resolve the portal item](/docs/developer-guide/arcgis/items), then select a service layer | Item resolution does not reproduce a complete web map |

Use the service URL from the item's details or ArcGIS Services Directory, not the address of Map
Viewer. For a feature service with several layers or tables, select the intended layer ID rather
than assuming it is `0`. A hosted layer view may expose different fields and filters from its
source layer. Begin with [the user guide](/docs/developer-guide/arcgis) for a complete example.

## Service support

| Service | Source loader | Runtime contract | Primary output | deck.gl | Documentation |
| --- | --- | --- | --- | --- | --- |
| ArcGIS FeatureServer | `ArcGISFeatureServerSourceLoader` | `VectorSource` | Complete bounded GeoJSON, binary or Arrow queries; explicit page API | `SourceLayer` | [FeatureServer](/docs/modules/arcgis/arcgis-feature-server) |
| ArcGIS ImageServer | `ArcGISImageServerSourceLoader` | `ImageSource` | Rendered image or decoded LERC raster | `SourceLayer` for rendered images | [ImageServer](/docs/modules/arcgis/arcgis-image-server) |
| ArcGIS ImageServer tiles | `ArcGISImageTileSourceLoader` | `TileSource` | Image tiles or decoded LERC tiles | `SourceLayer` for image tiles | [ImageServer](/docs/modules/arcgis/arcgis-image-server) |
| ArcGIS MapServer | `ArcGISMapTileSourceLoader` | `TileSource` | Cached or dynamically exported image tiles | `SourceLayer` | [MapServer](/docs/modules/arcgis/arcgis-map-server) |
| ArcGIS VectorTileServer | `ArcGISVectorTileServerSourceLoader` | `VectorTileSource` | Raw MVT or decoded WGS84 features | `SourceLayer` | [VectorTileServer](/docs/modules/arcgis/arcgis-vector-tile-server) |
| ArcGIS SceneServer | `ArcGISSceneServerSourceLoader` | `Tileset3DSource` or `PointCloudTilesetSource` | I3S mesh, Point, or Point Cloud tiles | Application-specific 3D renderer | [SceneServer](/docs/modules/arcgis/arcgis-scene-server) |
| ArcGIS service directory | Capability graph utilities | Discovery graph | First matching service endpoint | Not directly visual | [Capability discovery](#capability-discovery) |

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/arcgis
```

Install `@loaders.gl/deck-layers` and deck.gl when a service should be rendered directly.

## One registry, three entry points

`ARCGIS_LOADERS` is the recommended registry for applications that may receive more than one
ArcGIS service type. URL detection handles conventional ArcGIS REST endpoint names. Use
`core.type` when a proxy or rewritten URL hides the service type.

### Load a service

For a `SourceLoader`, `load` returns a source object rather than downloading an entire service:

```ts
import {load} from '@loaders.gl/core';
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';

const source = await load(serviceUrl, ARCGIS_LOADERS);
const metadata = await source.getMetadata();
```

### Create a typed source

Use `load` when the application already knows the service type:

```ts
import {load} from '@loaders.gl/core';
import {ArcGISFeatureServerSourceLoader} from '@loaders.gl/arcgis';

const source = await load(serviceUrl, [ArcGISFeatureServerSourceLoader]);
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
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';

const layer = new SourceLayer({
  id: 'city-service',
  data: serviceUrl,
  loaders: ARCGIS_LOADERS,
  extent: [-180, -85.051129, 180, 85.051129],
  crs: 'EPSG:4326',
  requestCrs: 'EPSG:4326',
  layers: ['0'],
  pickable: true
});
```

`SourceLayer` is intended for visual sources. Catalogs and analytical LERC rasters remain data
objects until the application chooses a record, band, color ramp, and NoData treatment.

## Authentication and practical setup

A service that works while you are signed in to ArcGIS may still require credentials in your
application. Use anonymous access for public data, an application-managed user session for
organizational content, or your organization's backend/proxy flow. API keys are appropriate only
for resources and privileges that support them; they do not replace a user's private-data access.
The [authentication guide](/docs/developer-guide/arcgis/authentication) covers token callbacks,
ArcGIS REST JS sessions, refresh, and Enterprise deployments.


Use `ArcGISAuthentication` to scope a token to the exact ArcGIS Online, Enterprise, or proxy
origin. The credential follows metadata, feature, image, tile, and deck.gl requests:

```ts
import {ArcGISAuthentication} from '@loaders.gl/arcgis/authentication';

const source = await load(serviceUrl, ARCGIS_LOADERS, {
  core: {
    credentials: [
      new ArcGISAuthentication({origins: [new URL(serviceUrl).origin], token})
    ]
  }
});
```

ArcGIS tokens already present in a service URL are preserved and take precedence. Bearer headers,
cookies, cancellation, proxies, and custom transports continue to use standard loaders.gl fetch
options. Async token callbacks support one deduplicated refresh after 401, 403, 498, or 499.
See the [authentication guide](/docs/developer-guide/authentication) for the common model and
security boundaries.

`authentication.createFetch()` supplies a shared transport for item resolution, discovery and service
requests, with refresh tokens isolated per trusted origin. Sign-in and session lifecycle stay in the
application; the ArcGIS package has no Esri SDK dependency. See the
[ArcGIS authentication guide](/docs/developer-guide/arcgis/authentication) for session integration.

Service-specific options can add ArcGIS request parameters without bypassing the source API. See
the individual service pages for the supported option names.

## Before connecting your application

| Task | Practical check | ArcGIS documentation |
| --- | --- | --- |
| Find the right data URL | Select the actual layer/table endpoint and inspect its metadata with `f=pjson` | [Working with data services](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/how-to-work-with-data-services/) |
| Confirm access | Check item sharing and service privileges with the identity your application will use | [Share items](https://doc.arcgis.com/en/arcgis-online/share-maps/share-items.htm) |
| Choose sign-in | Register your application and use a flow suitable for Online or your Enterprise portal | [Authentication types](https://developers.arcgis.com/documentation/security-and-authentication/types-of-authentication/) · [User authentication flows](https://developers.arcgis.com/documentation/security-and-authentication/user-authentication/flows/) |
| Allow browser requests | Test from the deployed application origin; configure CORS or an approved proxy | [ArcGIS Server cross-domain requests](https://doc.esri.com/en/arcgis-enterprise/latest/administer/restricting-cross-domain-requests-to-arcgis-server.html) |
| Retrieve the intended records | Apply filters and fields; respect service page limits and inspect completeness | [Feature query parameters](https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/) |
| Preserve map meaning | Check CRS, scale/time settings, attribution and item usage terms; reproduce client styling explicitly | [Service metadata](https://developers.arcgis.com/rest/services-reference/enterprise/map-service/) |

Feature pagination is automatic within a bounded query. `getFeatures()` throws if the result cannot
be established as complete; `queryFeatures()` exposes completion and partial-result reasons.
Narrow the query or deliberately configure `maxFeatures` rather than assuming one response contains
all records. See [pagination and completeness](/docs/developer-guide/arcgis/feature-layers#pagination-and-completeness).

For viewport updates, debounce requests and cancel obsolete work with `AbortSignal`. Test a secured
layer, token expiry and follow-up tile/scene resources from your production origin. A successful
metadata request alone does not verify an entire service workflow. The
[troubleshooting guide](/docs/developer-guide/arcgis/troubleshooting) covers common symptoms.

## Capability discovery

Applications can discover an ArcGIS REST directory and select its services by kind, format, and
coordinate system. Discovery is optional: direct source construction is simpler when the endpoint
is already known.

```ts
import {ARCGIS_LOADERS} from '@loaders.gl/arcgis';
import {discoverArcGISCapabilities, selectArcGISService} from '@loaders.gl/arcgis/discovery';
import {load} from '@loaders.gl/core';

const graph = await discoverArcGISCapabilities('https://example.com/arcgis/rest/services');
const imagery = graph && selectArcGISService(graph, {kind: 'image', format: 'lerc'});
const source = imagery && await load(imagery.url, ARCGIS_LOADERS, {
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
import {ArcGISSceneServerSource} from '@loaders.gl/arcgis/bundled';
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

## Portal items

Use `resolveArcGISItem` from `@loaders.gl/arcgis/items` to resolve service-backed portal items into
explicit layer/table choices. See the [item guide and embedded example](/docs/developer-guide/arcgis/items)
for supported item types, metadata, authentication and deployment verification.
