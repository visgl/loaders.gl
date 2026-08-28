# ArcGIS SceneServer

`ArcGISSceneServerSource` provides a thin service facade for I3S layers published through an ArcGIS
`SceneServer` endpoint. It fetches and normalizes layer metadata, then delegates traversal and
content decoding to the existing `I3SSource` (mesh and Point) or `I3SPointCloudSource`
implementation.

## Usage

```ts
import {coreApi} from '@loaders.gl/core';
import {ArcGISSceneServerSource} from '@loaders.gl/services';

const source = new ArcGISSceneServerSource(
  'https://example.com/arcgis/rest/services/City/SceneServer/layers/0',
  {'arcgis-scene-server': {token: 'secret'}},
  coreApi
);

const metadata = await source.getMetadata();
const tilesetSource = await source.getTilesetSource();
```

A URL ending at `/SceneServer` can be used with an explicit layer identifier:

```ts
const source = new ArcGISSceneServerSource(SCENE_SERVER_URL, {
  'arcgis-scene-server': {layerId: 0}
});
```

The source accepts custom fetch implementations through the normal `core.loadOptions` mechanism.
For new integrations, configure `createArcGISCredential` in
`core.loadOptions.core.credentials`; it follows metadata and I3S resource requests without being
sent to unrelated origins. The existing `arcgis-scene-server.token` and `i3s.token` options remain
supported. See [authentication](/docs/developer-guide/authentication). Mesh, Point, and Point Cloud
profiles are selected automatically.

## API

### `getMetadata()`

Returns the layer URL, layer type, version, storage profile, capabilities, spatial reference,
extent, and parsed I3S layer document.

### `getTilesetSource()`

Returns an `I3SSource` for mesh and Point layers or an `I3SPointCloudSource` for Point Cloud layers.

### `getLayerURL()`

Returns the normalized `/SceneServer/layers/{id}` URL. A `layerId` option is required when the
constructor receives a service URL without a layer segment.

### `query(options)`

Runs a read-only ArcGIS SceneServer layer query. `where`, `objectIds`, geometry filters,
`outFields`, `inSR`, `outSR`, `resultOffset`, and `resultRecordCount` are forwarded using ArcGIS
REST syntax. Authentication, custom fetch, and `AbortSignal` options are preserved. The result
contains `features`, optional `fields`, `exceededTransferLimit`, and the raw response metadata.

`getFeatures(options)` is an alias for applications that use a generic feature-source interface.

```ts
const result = await source.query({
  where: "CATEGORY = 'Building'",
  outFields: ['OBJECTID', 'CATEGORY'],
  returnGeometry: true,
  resultRecordCount: 500,
  signal: abortController.signal
});
```

Renderer, visual-variable, label, and popup expressions are returned as typed metadata and are
not evaluated by the loader. Use `aggregateArcGISSceneFeatures` for deterministic client-side
count, sum, min, max, average, and group-by operations.
