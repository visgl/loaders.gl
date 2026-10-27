# TileMatrix frame selection

`selectTileMatrixTiles` selects tiles from complete `TileGrid.tileMatrixSet` geometry using an
explicit frame in that grid's CRS. Its `TileMatrixSelectionGrid` type describes only the geometry and coverage fields it reads; existing `TileGrid` objects are structurally compatible. It is available from the lightweight
`@loaders.gl/tiles/tile-matrix` subpath and the tiles package root.

```typescript
import {selectTileMatrixTiles} from '@loaders.gl/tiles/tile-matrix';

const metadata = await source.getMetadata();
if (!metadata.tileGrid?.tileMatrixSet) throw new Error('Complete grid geometry is required');
const tiles = selectTileMatrixTiles(metadata.tileGrid, {
  crs: metadata.tileGrid.tileMatrixSet.crs,
  extent: [500000, 5198976, 501024, 5200000],
  resolution: 2
});
for (const tile of tiles) {
  await source.getTileData({...tile, signal});
}
```

The extent is `[minimumX, minimumY, maximumX, maximumY]` in native coordinates. Resolution is
coordinate units per pixel, not necessarily metres or degrees. The caller must first convert any
viewport frame into these units; this function performs no reprojection or CRS equivalence lookup.
The CRS string must exactly match `tileMatrixSet.crs`. Partial grid metadata is rejected.
Extents do not wrap across the antimeridian; split a wrapping frame into ordered extents before selecting.

## Selection and coverage

The selector uses math.gl's coarsest matrix whose resolution meets the target, falling back to the
finest available matrix when all levels are coarser. For anisotropic pixels, both axes must meet
the target. Array order and identifiers do not determine resolution. Equal-resolution ties retain math.gl's first-matrix policy. Coverage does not change the
selected level: a selected level omitted from a present limits list returns no tiles.

Extent queries use math.gl's half-open edge rules and support top-left or bottom-left origins,
per-level rectangular tile sizes and independent X/Y resolutions. `grid.limits` clips the selected
range. An omitted limits list means unrestricted coverage; an empty list means no available tiles.
Unknown/duplicate matrix IDs in limits and invalid inclusive rectangles reject. The output is
ordered by native row, then column. A frame outside geometry or coverage returns an empty array.

`options.maximumTileCount` bounds eager allocation, default 4096. An oversized selection throws before
creating its tile array; it is not silently truncated or replaced by a coarser level. A caller can
choose a coarser frame or a different explicit budget. Budget values must be nonnegative safe integers.

## Native request identity

Each result has:

| Field | Meaning |
| --- | --- |
| `tileMatrix` | Authoritative native matrix ID, passed at the top level of `getTileData`. |
| `index` | Native column/row, plus numeric `z` equal to the matrix's array index for compatibility. |
| `id` | Unambiguous JSON encoding of CRS, matrix ID, column and row. Scoped to this source/grid. |
| `bbox` | Cartesian `{left, bottom, right, top}` in the grid CRS, even for a geographic grid. |
| `crs` | The exact native CRS identifier. |
| `tileSize` | Logical `[width, height]` pixels from the selected level. |

Use `tileMatrix`, not `index.z`, to address the service. IDs remain stable when the matrix array
is reordered, but are not global keys across services or revised grid definitions. Applications
remain responsible for cache scoping/invalidation and request concurrency. Pass an abort signal
when loading the selected requests; selection itself is synchronous and does not fetch content.

## Current scope and example

Our current thinking is that a renderer-independent native frame can provide a useful selection
boundary while traversal ownership and deck.gl APIs are discussed. This first step does not wire
into `Tileset2D`, infer parent relationships, modify its cache keys, or enable projected deck.gl
rendering. A viewport adapter and compatible renderer still need to supply and interpret the
frame, bounds and per-axis tile dimensions. We would welcome feedback before extending that seam.

Regular and variable-width/coalesced rows are supported through math.gl's row-band ranges.
Columns advance by each band's coalescence factor; the selector emits each canonical tile once.
Limits remain in base-grid coordinates. A tile is available when any of its base-column aliases
is covered, so its returned canonical column can precede `minTileColumn`. Bounds cover the whole
coalesced footprint while `tileSize` retains the declared pixel dimensions. Level selection uses
nominal resolution; the tile budget counts canonical tiles across all bands before allocation.

Complete geometry is not a promise that a renderer supports the grid. The default XYZ renderer
explicitly rejects coalesced grids. See [shared grid validation](/docs/modules/core/loader-utils/api-reference/tile-grid)
for diagnostics and canonical request resolution.

The runnable [fixed-frame example](https://github.com/visgl/loaders.gl/tree/master/examples-experimental/tile-matrix-fixed-frame)
uses an illustrative UTM31 grid and the actual OGC source with an offline transport. Its integration
test asserts exact native request URLs, limits and cancellation-signal forwarding, without a live
service. See also [tile matrix concepts](/docs/developer-guide/tile-matrices).
