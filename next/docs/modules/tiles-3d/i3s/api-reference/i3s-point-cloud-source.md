I3S point-cloud source

![](/next/images/format-logos/ogc-mark.svg)OGCI3S

# Use I3S point clouds with one traversal API.

`I3SPointCloudSource` adapts I3S 2.x point-cloud layers to `PointCloudTileset`. It handles layer metadata, node resources, precision, elevation placement, and optional CRS conversion while the tiles runtime manages visibility and budgets.

[I3S module](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)[Point-cloud tiles](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md)[CRS in I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md)

The point-cloud source boundary

## Discover once. Request visible nodes. Render stable points.

The source translates producer-specific I3S resources into the common point-cloud tiles contract without making the application understand LEPCC pages, offsets, or elevation metadata.

01

Input

SceneServer layer, SLPK URL, or SLPK Blob

02

Decode

LEPCC XYZ with RGB, intensity, flags, and attributes

03

Spatial

Target CRS, origin-relative positions, and bounds

04

Runtime

PointCloudTileset traversal, budgets, and visibility

Detailed guide

## Source behavior and spatial details

The sections below document construction, attributes, precision, CRS conversion, elevation placement, and source-specific limits.

`I3SPointCloudSource` adapts an I3S 2.x Point Cloud layer to the shared [`PointCloudTileset`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md) traversal API. It accepts a SceneServer layer URL, an SLPK URL, or an SLPK `Blob`.

```
import {I3SPointCloudSource} from '@loaders.gl/tiles-3d/i3s';

import {PointCloudTileset} from '@loaders.gl/tiles-3d';



const source = new I3SPointCloudSource(layerUrl, {

  i3s: {token: arcgisToken},

  spatial: {targetCrs: 'EPSG:3857'}

});

const tileset = new PointCloudTileset(source, {pointBudget: 2_000_000});

await tileset.tilesetInitializationPromise;
```

The source decodes LEPCC XYZ, RGB, intensity, and flag resources and maps them to point-list Arrow tables. Metadata-described scalar attributes are retained under their declared names. `density-threshold` node-page metrics are honored by `PointCloudTileset`; producer-specific encodings and authoring are intentionally outside this read-only source.

`spatial.targetCrs` requests geographic, projected, or WGS84 geocentric output. The source reprojects absolute `Float64` points, then returns renderer-ready `Float32` offsets around a stable target origin. Each tile retains a WGS84 geographic `boundingVolume` for generic traversal and exposes the content/output-frame bound separately as `spatialBoundingVolume`. See [Coordinate reference systems in I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md) for supported definitions and registration rules.

Source Z units, elevation offsets, and all `elevationInfo` placement modes are applied to points and bounds. Configure `spatial.terrainElevationProvider` for `onTheGround` and `relativeToGround`, or `spatial.sceneElevationProvider` for `relativeToScene`. The application does not need to repeat vertical metadata discovered from the layer. See [Vertical Coordinate Systems and Elevation Placement](https://loaders.gl/next/docs/developer-guide/vertical-coordinate-systems.md) for provider and geoid examples.
