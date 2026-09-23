---
title: Coordinate reference systems in 3D Tiles
description: Keep the world frame, geographic regions, transforms, and coordinate metadata distinct while traversing a 3D Tiles dataset.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles runtime / coordinates"
  title="Know which frame the tiles actually use."
  description="3D Tiles can describe a local or geocentric world frame, geographic regions, and affine placement transforms. loaders.gl preserves authoritative metadata and does not infer ECEF merely from large coordinate values."
  tone="orange"
  meta={['World-frame discovery', 'Regions and transforms', 'Explicit CRS metadata']}
/>

<Tiles3DDocsTabs active="runtime" />

<DocOrientation
  eyebrow="Coordinate meaning and placement"
  title="Metadata says what the numbers mean; transforms say where the tile sits."
  description="A region carries geographic semantics, while boxes, spheres, and content transforms participate in runtime culling. Keeping those roles separate avoids silently changing a dataset’s world frame."
  tone="orange"
  items={[
    {label: 'Discover', value: 'Use explicit metadata and schema before fallback evidence.'},
    {label: 'Preserve', value: 'Retain CRS identifiers, epochs, entities, and original values.'},
    {label: 'Transform', value: 'Apply affine placement to Cartesian volumes, not geographic regions.'},
    {label: 'Report', value: 'Expose normalized spatial metadata on the initialized tileset.'}
  ]}
/>

<ReferenceBoundary
  title="3D Tiles coordinate reference"
  description="The detailed reference covers discovery precedence, regions, Cartesian bounds, transforms, schema metadata, and the relationship to shared CRS types."
  tone="orange"
/>

3D Tiles separates its affine tile hierarchy from the CRS of the world frame containing that
hierarchy. Many global tilesets use ECEF coordinates, but local tilesets are valid. loaders.gl uses
specification semantics and volume rules; it does not guess ECEF from large-looking numbers.

For shared types, Proj4/geoid registration, and vertical conversion, see
[Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems).

## Discovery precedence

loaders.gl classifies the world frame in this order:

1. an explicit application source override for incomplete or incorrect data;
2. draft 2.0 `EXT_geospatial_crs` metadata on the tileset glTF;
3. `TILESET_CRS_GEOCENTRIC` in the tileset metadata entity and schema;
4. a root geographic `region`, which establishes the specification global frame;
5. inherited placement from a parent or external tileset;
6. unknown/local when no authoritative evidence exists.

`TILESET_CRS_GEOCENTRIC: "UNKNOWN"` stays explicitly unknown and is not replaced by a region
fallback. `TILESET_CRS_COORDINATE_EPOCH` is retained alongside the CRS. An unresolved external
schema produces a diagnostic because its semantics must be loaded before discovery is complete.

```ts
const tilesetJson = await load(url, Tiles3DLoader);
console.log(tilesetJson.spatialMetadata);
```

After source initialization the same normalized information is exposed on
`tileset.spatialReference`. Original schema classes, metadata entities, and values remain intact.

### Draft glTF CRS declarations

Experimental 3D Tiles 2.0 resources can declare `EXT_geospatial_crs` with either a `wkid` or
`wkt2` representation. For `wkid`, loaders.gl exposes the horizontal identifier as
`authority:wkid`, preserves an optional coordinate epoch, and exposes a recognized `vcsWkid` as
the vertical CRS. For `wkt2`, the complete WKT2 definition remains the source CRS. The normalized
`coordinateFrame`, units, height reference, and diagnostics describe what loaders.gl could
determine from that declaration; unknown identifiers and unsupported vertical CRSs remain
explicitly unresolved rather than receiving a WGS84 fallback.

`EXT_georeference` places a node's local right/up/forward frame at its longitude, latitude, and
height before composing the node's matrix or TRS transform. The current affine implementation is
valid only when `EXT_geospatial_crs` declares `EPSG:4978` without a separate vertical CRS.
Projected, geographic, WKT2, and separate-vertical-CRS combinations are rejected because they
require nonlinear projection or vertical-datum operations that cannot be represented by that
single matrix.

## Regions and Cartesian bounds

A `region` contains west, south, east, north in radians and minimum/maximum ellipsoidal height. Its
geographic semantics are analogous to EPSG:4979, while content and runtime culling use a geocentric
world frame. Region subdivision preserves wrapped longitude at the antimeridian.

Tile affine transforms apply to box and sphere bounds. They do not transform a `region`; it already
describes a geographic world-space volume. S2 extension volumes similarly retain their geospatial
meaning while normalizing to conservative runtime bounds.

## Camera elevation and high-altitude content

For a geospatial deck.gl viewport, use the same altitude frame for the camera and the tiles.
`Tileset3D` derives its traversal camera and culling planes from the supplied render viewport;
it does not add a terrain-height offset. Geographic `region` heights are meters above the WGS84
ellipsoid, not heights above local ground or a geoid-based sea level.

A default `WebMercatorViewport` targets elevation zero. At street zoom its camera can be below
high-altitude content even when longitude and latitude are correct. For example, the 898 × 320,
zoom 17, top-down Zürich viewport in [issue #3475](https://github.com/visgl/loaders.gl/issues/3475)
puts the camera at about 194 m while nearby content starts around 405 m. That content is behind
the downward-looking camera, so both rendering and traversal exclude it.

In a standalone deck.gl application, initialize the camera target at a suitable elevation:

```ts
const viewState = {
  longitude: 8.5391,
  latitude: 47.3686,
  zoom: 17,
  pitch: 0,
  bearing: 0,
  position: [0, 0, 405] // Meter offsets from the longitude/latitude origin, including elevation.
};
```

The website 3D Tiles example initializes this position from `tileset.cartographicCenter[2]`
unless the example specifies its own `viewState.position`. The center is a viewing target,
not a terrain sample. For broad datasets, choose a local target elevation rather than treating
the root region's minimum height as ground height everywhere. Preserve explicit application
placement, including `[0, 0, 0]`, and avoid adding the same elevation twice.

For continued terrain-aware navigation, see deck.gl's
[TerrainController guide](https://deck.gl/docs/developer-guide/base-maps/using-with-3d-tiles).
Depth picking requires rendered content, so initialize the camera above the intended scene or
start zoomed out before relying on surface picking. When using `MapboxOverlay`, the host map
owns the camera: configure its terrain-aware view and pass that same viewport to traversal.
Setting a standalone deck.gl `position` does not move the host map's camera.

If content disappears at close zoom, compare
`viewport.unprojectPosition(viewport.cameraPosition)[2]` with its region heights and inspect
whether representative content points lie inside the render clip volume. Moving only the
traversal camera may cause requests without making the content renderable, and also invalidates
camera-distance and screen-space-error calculations.

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
is resolved independently before placing the child root in the parent's requested output frame, and
the same nested descriptor is passed to glTF content decoding. A nonlinear datum or epoch operation
is not approximated by one affine matrix; unresolved nested operations fail before child headers are
installed.

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
| Draft `EXT_geospatial_crs` WKID/WKT2 discovery | Experimental |
| Draft `EXT_georeference` into `EPSG:4978` | Experimental |
| Draft georeference into projected/geographic or separate vertical CRSs | Rejected |
| Normalized loader/source/runtime metadata | Implemented |
| Deterministic Proj4/geoid primitive | Implemented |
| External schema semantic resolution | Planned source-loading integration |
| Per-vertex nonlinear reprojection and bound rebuilding | Integration in progress |
| Nested tileset CRS placement | Experimental |
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
