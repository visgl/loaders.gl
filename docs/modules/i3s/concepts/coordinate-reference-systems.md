# Coordinate reference systems in I3S

I3S combines a horizontal CRS, optional vertical CRS, height model, and layer placement rules.
These inputs answer different questions and must be handled separately. loaders.gl discovers them
automatically and exposes both the original fields and normalized spatial metadata.

For the framework model, resource registration, and transformation API, see
[Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems). For exact
vertical operation order, formulas, provider contracts, and examples, see
[Vertical Coordinate Systems and Elevation Placement](/docs/developer-guide/vertical-coordinate-systems).

## Discovery

The loader reads CRS information in this order:

1. `spatialReference.latestWkid`, then legacy `wkid`;
2. embedded `spatialReference.wkt` when no WKID is available;
3. the equivalent `fullExtent` spatial reference as a fallback;
4. `heightModelInfo.vertCRS`, then `latestVcsWkid` or `vcsWkid`;
5. `heightModelInfo.heightModel` for ellipsoidal versus gravity-related heights;
6. `elevationInfo` for placement after source height interpretation.

Legacy ArcGIS WKIDs often have a current alias. `wkid: 102100` with `latestWkid: 3857`, for
example, normalizes to `EPSG:3857`; the original values remain on the parsed layer.

```ts
const layer = await load(url, I3SLoader);

console.log(layer.spatialReference); // original I3S object
console.log(layer.spatialMetadata);  // normalized descriptor
```

SceneServer metadata exposes the descriptor as `spatialMetadata`; mesh `Tileset3D` exposes it as
`tileset.spatialReference`; `I3SPointCloudSource.spatialReference` is populated at initialization.

## Requesting horizontal output

Mesh and Point Cloud sources share the same `TilesetSpatialOptions` contract. Configure a mesh
target on `Tileset3D`, after constructing its `I3SSource`:

```ts
const source = new I3SSource({url: layerUrl, loader: I3SLoader});
const tileset = new Tileset3D(source, {
  spatial: {targetCrs: 'EPSG:3857'}
});
await tileset.tilesetInitializationPromise;
```

Point Cloud layers receive the same option directly on their source:

```ts
const source = new I3SPointCloudSource(layerUrl, {
  spatial: {targetCrs: 'EPSG:3857'}
});
await source.initialize();
```

Common definitions known to Proj4 can be used directly. Register application-owned WKT or PROJ
definitions with `registerSpatialCrs()` before constructing the source. Resource lookup is always
explicit and no EPSG definition, datum grid, or geoid is downloaded while loading a layer.

## Wire order

I3S global geometry, node centers, spheres, boxes, and extents use longitude, latitude, height
order. This remains true for `EPSG:4326`, whose authoritative axes are latitude, longitude.
loaders.gl records normalized `xyz` wire order and maps values before calling Proj4. Applications
should not swap I3S longitude and latitude based only on EPSG axis metadata.

Projected and custom WKT layers retain declared X/Y order. WKT axis declarations are interpreted by
the I3S adapter instead of being delegated to different Proj4 defaults.

## Heights and placement

| Metadata | Meaning | Runtime dependency |
| --- | --- | --- |
| `heightModel: ellipsoidal` | Z is measured from the reference ellipsoid | Ellipsoid from resolved CRS |
| `heightModel: gravity_related_height` | Z is orthometric/gravity-related | Compatible geoid for ellipsoidal conversion |
| `absoluteHeight` | Use interpreted source Z, then apply offset | CRS, units, and optional geoid |
| `onTheGround` | Replace feature Z with sampled ground | Terrain provider |
| `relativeToGround` | Add feature Z and offset to sampled ground | Terrain provider plus CRS conversion |
| `relativeToScene` | Add feature Z and offset to the scene surface | Scene elevation provider |

A geoid is not terrain. Converting an orthometric height to ellipsoidal height does not determine
ground elevation at that location.

`ZFactor`, `heightUnit`, and `elevationInfo.unit` apply before height-reference conversion. All
intermediate positions remain double precision. Renderer-facing `Float32` attributes are created
only after subtracting the tile origin.

The layer supplies these declarations; applications do not copy them into loader options. An
application only supplies `terrainElevationProvider` for ground modes or
`sceneElevationProvider` for `relativeToScene`. Providers receive WGS84 longitude/latitude pairs
and return one height per position. Provider units and height reference can be declared when they
differ from meters and the layer's source reference.

## Geometry, origins, and bounds

An I3S mesh normally stores vertex offsets from a node center. Correct transformation is:

1. reconstruct an absolute `Float64` source position;
2. normalize I3S axis order and units;
3. apply source-height and `elevationInfo` semantics;
4. apply Proj4 and any geoid conversion;
5. choose a stable target origin;
6. subtract the origin, then downcast renderer attributes;
7. rebuild bounds in the target frame.

Transforming only the node center is insufficient because projected operations are not generally
affine across a tile. Normals use local inverse-transpose/Jacobian information; they are not passed
through the position function.

At the antimeridian, geographic bounds use wrapped intervals rather than expanding across nearly
the entire globe. Target-frame Cartesian bounds are rebuilt from samples and exposed as
`spatialBoundingVolume`. Mesh traversal retains a WGS84 ECEF bound and Point Cloud traversal
retains a WGS84 geographic bound, because generic traversal operates in those common frames
independently of the renderer's requested output CRS.

## Current v5 boundary

| Capability | Status |
| --- | --- |
| WKID/latestWKID and WKT discovery | Implemented |
| VCS and height-model discovery | Implemented |
| Normalized loader, source, service, and runtime metadata | Implemented |
| Deterministic Proj4 and geoid primitive | Implemented |
| Existing WGS84 mesh and Point Cloud output | Implemented |
| Supported geographic/projected vertices, normals, origins, and bounds | Implemented for mesh and Point Cloud sources |
| Vertical source units and elevation-offset units | Implemented for common metric, international, US survey, and legacy ArcGIS units |
| All elevation placement modes | Implemented for mesh and Point Cloud; ground/scene modes require an application provider |
| Provider and output height-reference conversion | Implemented with an application-supplied `@math.gl/geoid` model |
| Dynamic coordinate-epoch operations | Not yet executable |

Missing metadata or registered resources cause an actionable error. A requested operation never
falls back to coordinates in a different CRS.

Renderer-facing positions remain `Float32` offsets around a double-precision target origin.
Projected and geocentric outputs include that origin in `modelMatrix`; geographic output uses
`lnglat-offsets`. Returned content and source metadata report `status: 'transformed'` only after
geometry and the parallel `spatialBoundingVolume` have moved into the requested frame. Traversal
bounds are normalized separately into their documented ECEF or geographic common frame.

## Authoring requirements

Writers should emit a current horizontal WKID when available, preserve custom WKT, emit vertical
CRS and `heightModelInfo` together, specify units, and calculate extents in the declared source
CRS. Generated bounds and geometry must agree with the metadata. Conformance round trips compare
normalized metadata, reconstructed absolute positions, and bounds in one frame.

## Related material

- [I3S format and feature matrix](../formats/i3s)
- [I3S spatial reference specification](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/spatialReference.cmn.md)
- [I3S height model specification](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/heightModelInfo.cmn.md)
- [ArcGIS elevationInfo](https://developers.arcgis.com/web-scene-specification/objects/elevationInfo/)
