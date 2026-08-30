---
title: ArcGIS SceneServer
description: Connect ArcGIS SceneServer layers to I3S and 3D tileset sources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {ServiceSourceGraphic} from '@site/src/components/docs/service-source-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="Services module · ArcGIS 3D source"
  title="ArcGIS SceneServer"
  description="Connect an ArcGIS SceneServer layer to the loaders.gl 3D source runtime, delegating I3S mesh, point, and point-cloud decoding to the existing format implementations."
  tone="violet"
  logos={[{alt: 'ArcGIS', src: '/images/format-logos/arcgis-logo.svg'}]}
  meta={['SceneServer', 'I3S', '3D source integration']}
  links={[
    {label: 'Services module', to: '/docs/modules/services'},
    {label: 'ArcGIS service API', to: '/docs/modules/services/api-reference/arcgis'},
    {label: 'I3S format', to: '/docs/modules/i3s/formats/i3s'}
  ]}
/>

<DocLiveExample label="ArcGIS SceneServer I3S example" height="440px">
  <ClientExample kind="i3s-building-scene-layer" />
</DocLiveExample>

<ServiceSourceGraphic kind="arcgis" />

<DocOrientation
  eyebrow="What it provides"
  title="Use a service endpoint without learning a second traversal runtime."
  description="SceneServer handles layer metadata, credentials, and source selection; the shared tiles runtime handles hierarchy traversal, visibility, requests, and content lifecycle."
  tone="violet"
  items={[
    {label: 'Metadata', value: 'Layer type, version, profile, and extent'},
    {label: 'Profiles', value: 'I3S mesh, Point, and Point Cloud'},
    {label: 'Runtime', value: 'Tileset traversal and content loading'},
    {label: 'Auth', value: 'Scoped credentials through core options'}
  ]}
/>

<ReferenceBoundary
  title="SceneServer reference"
  description="The sections below document construction, metadata, layer selection, authentication, and delegated I3S sources."
  tone="violet"
/>

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
