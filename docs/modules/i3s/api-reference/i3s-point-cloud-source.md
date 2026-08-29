---
title: I3SPointCloudSource
description: Traverse I3S point-cloud layers through the shared tiles runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="I3S point-cloud source"
  title="Use I3S point clouds with one traversal API."
  description="`I3SPointCloudSource` adapts I3S 2.x point-cloud layers to `PointCloudTileset`. It handles layer metadata, node resources, precision, elevation placement, and optional CRS conversion while the tiles runtime manages visibility and budgets."
  tone="orange"
  meta={['I3S 2.x', 'PointCloudTileset', 'CRS and elevation aware']}
  links={[
    {label: 'I3S module', to: '/docs/modules/i3s'},
    {label: 'Point-cloud tiles', to: '/docs/modules/tiles/api-reference/point-cloud-tileset'},
    {label: 'CRS in I3S', to: '/docs/modules/i3s/concepts/coordinate-reference-systems'}
  ]}
/>

<DocOrientation
  eyebrow="The point-cloud source boundary"
  title="Discover once. Request visible nodes. Render stable points."
  description="The source translates producer-specific I3S resources into the common point-cloud tiles contract without making the application understand LEPCC pages, offsets, or elevation metadata."
  tone="orange"
  items={[
    {label: 'Input', value: 'SceneServer layer, SLPK URL, or SLPK Blob'},
    {label: 'Decode', value: 'LEPCC XYZ with RGB, intensity, flags, and attributes'},
    {label: 'Spatial', value: 'Target CRS, origin-relative positions, and bounds'},
    {label: 'Runtime', value: 'PointCloudTileset traversal, budgets, and visibility'}
  ]}
/>

<ReferenceBoundary
  title="Source behavior and spatial details"
  description="The sections below document construction, attributes, precision, CRS conversion, elevation placement, and source-specific limits."
  tone="orange"
/>

`I3SPointCloudSource` adapts an I3S 2.x Point Cloud layer to the shared
[`PointCloudTileset`](/docs/modules/tiles/api-reference/point-cloud-tileset) traversal API.
It accepts a SceneServer layer URL, an SLPK URL, or an SLPK `Blob`.

```ts
import {I3SPointCloudSource} from '@loaders.gl/i3s';
import {PointCloudTileset} from '@loaders.gl/tiles';

const source = new I3SPointCloudSource(layerUrl, {
  i3s: {token: arcgisToken},
  spatial: {targetCrs: 'EPSG:3857'}
});
const tileset = new PointCloudTileset(source, {pointBudget: 2_000_000});
await tileset.tilesetInitializationPromise;
```

The source decodes LEPCC XYZ, RGB, intensity, and flag resources and maps them to
point-list Arrow tables. Metadata-described scalar attributes are retained under their declared
names. `density-threshold` node-page metrics are honored by `PointCloudTileset`; producer-specific
encodings and authoring are intentionally outside this read-only source.

`spatial.targetCrs` requests geographic, projected, or WGS84 geocentric output. The source
reprojects absolute `Float64` points, then returns renderer-ready `Float32` offsets around a stable
target origin. Each tile retains a WGS84 geographic `boundingVolume` for generic traversal and
exposes the content/output-frame bound separately as `spatialBoundingVolume`. See [Coordinate
reference systems in I3S](../concepts/coordinate-reference-systems) for supported definitions and
registration rules.

Source Z units, elevation offsets, and all `elevationInfo` placement modes are applied to points
and bounds. Configure `spatial.terrainElevationProvider` for `onTheGround` and
`relativeToGround`, or `spatial.sceneElevationProvider` for `relativeToScene`. The application
does not need to repeat vertical metadata discovered from the layer. See [Vertical Coordinate
Systems and Elevation Placement](/docs/developer-guide/vertical-coordinate-systems) for provider
and geoid examples.
