# Vertical Coordinate Systems and Elevation Placement

The vertical position of 3D content is governed by three independent questions:

| Question | Example metadata or option | What it changes |
| --- | --- | --- |
| What unit is stored? | I3S `heightUnit`, `ZFactor`, `elevationInfo.unit` | Converts source Z values and offsets to meters |
| What surface is height measured from? | Ellipsoidal or orthometric height, vertical CRS, `geoidModel` | Converts between height datums |
| How is content placed? | I3S `elevationInfo.mode`, terrain or scene provider | Replaces or adds to source Z using a sampled surface |

These concepts are deliberately separate. A geoid converts between height references; it does not
describe terrain. A terrain provider supplies ground elevation; it does not identify whether that
elevation is ellipsoidal or orthometric unless its `heightReference` says so.

Applications normally do **not** populate source-unit, vertical-CRS, height-model, or placement
fields. I3S discovers them from layer metadata. Applications supply only a requested output, a
geoid when datum conversion is needed, and a terrain or scene provider when the layer requests
surface-relative placement.

## Order of operations

loaders.gl applies vertical operations in a fixed order:

1. Discover the horizontal CRS, vertical CRS, source height reference, vertical unit, and I3S
   placement mode.
2. Convert stored source Z to meters. An explicit legacy I3S `ZFactor` takes precedence over
   `heightUnit`, avoiding a duplicate conversion on layers that publish both.
3. Convert `elevationInfo.offset` from its declared unit to meters.
4. Sample the terrain or scene surface when the placement mode requires it.
5. Convert provider heights into the layer's source height reference, if the provider declares a
   different reference.
6. Apply the placement formula in the source height reference.
7. Convert to the requested target height reference with the configured geoid.
8. Transform horizontal coordinates, rebuild bounds, select a stable origin, and only then
   downcast renderer-relative offsets to `Float32`.

Node-bound centers follow the source vertical unit, while I3S sphere radii and OBB half-sizes are
metric. The implementation keeps those paths separate so unit conversion does not scale a tile's
physical extent.

## I3S placement formulas

After normalizing all values to meters in the layer's source height reference, loaders.gl uses the
following formulas:

```text
absoluteHeight  = sourceZ + offset
onTheGround     = terrain
relativeToGround = terrain + sourceZ + offset
relativeToScene  = scene + sourceZ + offset
```

`onTheGround` intentionally ignores source Z and offset. `relativeToScene` uses a separately
configured scene-surface provider; loaders.gl does not substitute terrain because the visible
scene can include buildings or other 3D content above the ground.

An `elevationInfo` unit applies to its offset. Constant or Arcade feature expressions are
preserved in I3S metadata, but per-feature expression evaluation belongs to renderer and popup
support and is not part of the spatial placement pipeline.

## Supplying terrain and scene elevations

Surface providers receive WGS84 longitude/latitude pairs in degrees, regardless of the layer or
requested target CRS. They return one finite height per location in the same order. Calls are
batched per geometry or bound operation and may be synchronous or asynchronous.

```ts
import type {TilesetElevationProvider} from '@loaders.gl/tiles';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import {I3SLoader} from '@loaders.gl/i3s';

const terrainElevationProvider: TilesetElevationProvider = {
  heightReference: 'orthometric',
  unit: 'meter',
  async sampleElevations(longitudeLatitudes) {
    return elevationService.sample(longitudeLatitudes);
  }
};

const source = new I3SSource({url: layerUrl, loader: I3SLoader});
const tileset = new Tileset3D(source, {
  spatial: {
    targetCrs: 'EPSG:4326',
    targetHeightReference: 'ellipsoidal',
    terrainElevationProvider,
    geoidModel: 'egm96-5'
  }
});
await tileset.tilesetInitializationPromise;
```

Point Cloud layers use the same contract directly on `I3SPointCloudSource`:

```ts
const source = new I3SPointCloudSource(layerUrl, {
  spatial: {
    targetCrs: 'EPSG:3857',
    terrainElevationProvider
  }
});
await source.initialize();
```

Use `terrainElevationProvider` for `onTheGround` and `relativeToGround`. Use
`sceneElevationProvider` for `relativeToScene`. If `unit` is omitted, meters are assumed. If
`heightReference` is omitted, the layer's source height reference is assumed. Declaring the
provider reference is recommended when its service contract is known.

loaders.gl never fetches terrain implicitly. This keeps loading deterministic and avoids coupling
a format loader to one terrain vendor, credential scheme, resolution, or licensing model.

## Units

Common metric, international, US survey, and historical ArcGIS linear unit names are normalized
to meters. This includes meter, millimeter, centimeter, decimeter, kilometer, foot, yard, mile,
US survey variants, and the Clarke, Sears, Benoit, Indian, and Gold Coast units used by legacy CRS
definitions. Common spellings and abbreviations such as `metre`, `m`, `ft`, and
`us-survey-foot` are accepted.

An unknown unit is an unresolved spatial operation and rejects initialization. It is never treated
as meters silently. This applies to source Z, elevation offsets, and provider results.

## Geoids and height references

Ellipsoidal height `h`, orthometric height `H`, and geoid undulation `N` follow the GeographicLib
convention:

```text
h = H + N
H = h - N
```

The same application-supplied `@math.gl/geoid` model can normalize a provider into the layer's
height reference and then convert the placed result into the requested output height reference.
The geoid is sampled at the geographic location before target projection.

Register reusable PGM resources during application startup, or pass an already parsed `Geoid`:

```ts
registerGeoidModelFromPgm('egm96-5', geoidPgmBytes, {cubic: true});

const spatial = {
  targetHeightReference: 'orthometric' as const,
  geoidModel: 'egm96-5'
};
```

No model is downloaded automatically. A requested ellipsoidal/orthometric conversion without a
known source height reference or compatible geoid fails explicitly.

## Bounds, traversal, and initialization

Surface placement is asynchronous, so I3S sources prepare the root bound before runtime tile
initialization. Child bounds and payload positions use the same provider and operation order.
Mesh traversal retains WGS84 ECEF bounds, Point Cloud traversal retains geographic bounds, and
both expose a parallel `spatialBoundingVolume` in the requested target frame.

A curved or varying surface is sampled across the bound rather than represented by a single Z
translation. The result is conservative for culling and remains dateline-aware.

## Failure behavior

Initialization or loading rejects when:

- a surface-relative mode has no matching terrain or scene provider;
- a provider returns the wrong number of values or a non-finite value;
- a source, offset, or provider unit is unsupported;
- provider and layer height references differ but cannot be converted;
- a requested height-datum conversion has no compatible geoid; or
- source CRS or height-reference metadata needed by the operation is unknown.

The loader does not catch these failures and continue with unplaced coordinates. Applications can
inspect `spatialReference.status` and `spatialReference.warnings` before loading child content.

## 3D Tiles

3D Tiles and I3S share target CRS, target height-reference, geoid registration, precision, and
bound-rebuilding infrastructure. Standard 3D Tiles global coordinates are ECEF meters and do not
define I3S-style `elevationInfo` placement modes, so terrain and scene providers are not applied to
3D Tiles implicitly. Format-specific metadata semantics may identify a source CRS or coordinate
epoch; local or unknown tilesets remain unresolved until the application supplies an expert source
override.

See [Coordinate Reference Systems](./coordinate-reference-systems) for the cross-format model and
[Coordinate reference systems in I3S](/docs/modules/i3s/concepts/coordinate-reference-systems) for
I3S-specific discovery and source examples.
