# Coordinate reference systems in 3D Tiles

3D Tiles separates its affine tile hierarchy from the CRS of the world frame containing that
hierarchy. Many global tilesets use ECEF coordinates, but local tilesets are valid. loaders.gl uses
specification semantics and volume rules; it does not guess ECEF from large-looking numbers.

For shared types, Proj4/geoid registration, and vertical conversion, see
[Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems).

## Discovery precedence

loaders.gl classifies the world frame in this order:

1. an explicit application source override for incomplete or incorrect data;
2. `TILESET_CRS_GEOCENTRIC` in the tileset metadata entity and schema;
3. a root geographic `region`, which establishes the specification global frame;
4. inherited placement from a parent or external tileset;
5. unknown/local when no authoritative evidence exists.

`TILESET_CRS_GEOCENTRIC: "UNKNOWN"` stays explicitly unknown and is not replaced by a region
fallback. `TILESET_CRS_COORDINATE_EPOCH` is retained alongside the CRS. An unresolved external
schema produces a diagnostic because its semantics must be loaded before discovery is complete.

```ts
const tilesetJson = await load(url, Tiles3DLoader);
console.log(tilesetJson.spatialMetadata);
```

After source initialization the same normalized information is exposed on
`tileset.spatialReference`. Original schema classes, metadata entities, and values remain intact.

## Regions and Cartesian bounds

A `region` contains west, south, east, north in radians and minimum/maximum ellipsoidal height. Its
geographic semantics are analogous to EPSG:4979, while content and runtime culling use a geocentric
world frame. Region subdivision preserves wrapped longitude at the antimeridian.

Tile affine transforms apply to box and sphere bounds. They do not transform a `region`; it already
describes a geographic world-space volume. S2 extension volumes similarly retain their geospatial
meaning while normalizing to conservative runtime bounds.

## Tile and content transforms

The complete position path may contain:

```text
content coordinates
  → quantization and feature-table decode
  → glTF up-axis conversion
  → RTC_CENTER or CESIUM_RTC origin
  → tile and ancestor transforms
  → external-tileset placement
  → source world CRS
  → requested output frame
```

Affine stages compose in double precision. A nonlinear CRS operation cannot generally be folded
into that matrix. Reprojection operates on absolute vertices and instances, then selects a new
local origin and rebuilds bounds. Normals, tangents, orientations, and geometric error use local
scale/Jacobian information rather than the position function.

For large projected tiles, transforming only the center while retaining original offsets is not
correct. Transforming only eight box corners can also be non-conservative when projected edges
curve; bounds need adaptive edge/face sampling or a documented conservative geographic method.

## Nested tilesets and epochs

An external tileset may declare a different CRS or coordinate epoch from its parent. Its descriptor
is resolved independently before placing the child root in the parent's requested output frame. A
nonlinear datum or epoch operation is not approximated by one affine matrix.

Dynamic CRS epochs are preserved today. The current `@math.gl/proj4` API has no coordinate-epoch
argument, so an operation that changes epoch rejects until an epoch-aware engine is available.
Copying an epoch number while transforming dynamic frames would overstate accuracy.

## Ellipsoids and local frames

The runtime derives the ellipsoid from resolved CRS metadata where possible. WGS84 is a default
only when the specification establishes that global frame; it is not a fallback for local or
explicitly different geocentric CRSs.

`local-enu` output needs an origin derived from dataset bounds. The frame uses exact geocentric
differences rotated into east/north/up, not meters-per-degree approximations. Origin selection and
precision match I3S so renderers receive one coordinate contract.

## Current v5 boundary

| Capability | Status |
| --- | --- |
| Inline geocentric CRS semantic discovery | Implemented |
| Coordinate epoch preservation | Implemented |
| Explicit `UNKNOWN` and local-frame handling | Implemented |
| Region-established global-frame discovery | Implemented |
| Normalized loader/source/runtime metadata | Implemented |
| Deterministic Proj4/geoid primitive | Implemented |
| External schema semantic resolution | Planned source-loading integration |
| Per-vertex nonlinear reprojection and bound rebuilding | Integration in progress |
| Cross-epoch operations | Not yet executable |

Conventional ECEF tilesets need no options. Overrides are for incomplete, mislabeled, or local
datasets and should be accompanied by application validation.

## Authoring requirements

Writers should emit `TILESET_CRS_GEOCENTRIC` when the frame differs from the conventional global
default or ambiguity remains. Dynamic coordinates should also emit the epoch semantic. Regions
always use longitude/latitude radians and ellipsoidal height; projected values must not be written
into them. External tilesets declare independent semantics when CRS or epoch differs.

## Related material

- [3D Tiles format matrix](../formats/3d-tiles)
- [Tile hierarchy and refinement](./tile-hierarchy-and-refinement)
- [3D Tiles metadata semantics](https://github.com/CesiumGS/3d-tiles/blob/main/specification/Metadata/Semantics/README.adoc)
- [3D Tiles specification](https://github.com/CesiumGS/3d-tiles/blob/main/specification/README.adoc)
