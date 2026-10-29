ArcGIS module · ArcGIS 3D source

![](/next/images/format-logos/arcgis-logo.jpg)Scene

# ArcGIS SceneServer

Connect your published scene layer to an I3S source. Inspect its layer profile and coordinates, then choose a compatible mesh, point, or point-cloud renderer.

[ArcGIS module](https://loaders.gl/next/docs/modules/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis.md)[Protocol and formats](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-scene-server.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/formats/arcgis-scene-server.md)[ArcGIS service API](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/arcgis/api-reference/arcgis.md)[I3S format](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

⛶⛶ Explore fullscreen

The embedded inspector loads SceneServer metadata through this module. It does not render the scene. For 3D rendering, use the [I3S examples](https://loaders.gl/next/docs/modules/tiles-3d/i3s/recipes/profile-gallery.md); building roots use a separate I3S loader.

Remote data, explicit steps

## Discover once. Request only what the application needs.

Service sources keep endpoint metadata, request construction, and decoded results separate. That makes a remote dataset behave like a predictable part of the data path.

01 · discover

### ArcGIS REST endpoint

A service directory exposes layers, operations, and formats.

FeatureServerImageServerSceneServer

pla&#x6E;**→**

02 · request

### Request the useful subset

Choose features, images, tiles, or scene content for this view.

wherebboxoutFieldssize

normaliz&#x65;**→**

[03 · application result](https://loaders.gl/next/docs/modules/arcgis.md)

### [VectorSource · ImageSource · Tileset3DSource](https://loaders.gl/next/docs/modules/arcgis.md)

[The application receives a source contract rather than a vendor-specific client.<!-- --> ↗](https://loaders.gl/next/docs/modules/arcgis.md)

The source owns protocol details; the application owns how returned features, pixels, tiles, or tables are used.

What it provides

## Use a service endpoint without learning a second traversal runtime.

SceneServer handles layer metadata, credentials, and source selection; the shared tiles runtime handles hierarchy traversal, visibility, requests, and content lifecycle.

01

Metadata

Layer type, version, profile, and extent

02

Profiles

I3S mesh, Point, and Point Cloud

03

Runtime

Tileset traversal and content loading

04

Auth

Scoped credentials through core options

Detailed guide

## SceneServer reference

The sections below document construction, metadata, layer selection, authentication, and delegated I3S sources.

`ArcGISSceneServerSource` provides a thin service facade for I3S layers published through an ArcGIS `SceneServer` endpoint. It fetches and normalizes layer metadata, then delegates traversal and content decoding to the existing `I3SSource` (mesh and Point) or `I3SPointCloudSource` implementation.

## Usage[​](#usage "Direct link to Usage")

```
import {coreApi} from '@loaders.gl/core';

import {ArcGISSceneServerSource} from '@loaders.gl/arcgis/bundled';



const source = new ArcGISSceneServerSource(

  'https://example.com/arcgis/rest/services/City/SceneServer/layers/0',

  {'arcgis-scene-server': {token: 'secret'}},

  coreApi

);



const metadata = await source.getMetadata();

const tilesetSource = await source.getTilesetSource();
```

A URL ending at `/SceneServer` can be used with an explicit layer identifier:

```
const source = new ArcGISSceneServerSource(SCENE_SERVER_URL, {

  'arcgis-scene-server': {layerId: 0}

});
```

For shared fetch and parser settings, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options). For new integrations, configure `createArcGISCredential` in `core.credentials`; it follows metadata and I3S resource requests without being sent to unrelated origins. The existing `arcgis-scene-server.token` and `i3s.token` options remain supported. See [authentication](https://loaders.gl/next/docs/developer-guide/authentication.md). Mesh, Point, and Point Cloud profiles are selected automatically.

## API[​](#api "Direct link to API")

### `getMetadata()`[​](#getmetadata "Direct link to getmetadata")

Returns the layer URL, layer type, version, storage profile, capabilities, spatial reference, extent, and parsed I3S layer document.

### `getTilesetSource()`[​](#gettilesetsource "Direct link to gettilesetsource")

Returns an `I3SSource` for mesh and Point layers or an `I3SPointCloudSource` for Point Cloud layers.

### `getLayerURL()`[​](#getlayerurl "Direct link to getlayerurl")

Returns the normalized `/SceneServer/layers/{id}` URL. A `layerId` option is required when the constructor receives a service URL without a layer segment.

### `query(options)`[​](#queryoptions "Direct link to queryoptions")

Runs a read-only ArcGIS SceneServer layer query. `where`, `objectIds`, geometry filters, `outFields`, `inSR`, `outSR`, `resultOffset`, and `resultRecordCount` are forwarded using ArcGIS REST syntax. Authentication, custom fetch, and `AbortSignal` options are preserved. The result contains `features`, optional `fields`, `exceededTransferLimit`, and the raw response metadata.

`getFeatures(options)` is an alias for applications that use a generic feature-source interface.

```
const result = await source.query({

  where: "CATEGORY = 'Building'",

  outFields: ['OBJECTID', 'CATEGORY'],

  returnGeometry: true,

  resultRecordCount: 500,

  signal: abortController.signal

});
```

Renderer, visual-variable, label, and popup expressions are returned as typed metadata and are not evaluated by the loader. Use `aggregateArcGISSceneFeatures` for deterministic client-side count, sum, min, max, average, and group-by operations.
