# I3SPointCloudSource

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
