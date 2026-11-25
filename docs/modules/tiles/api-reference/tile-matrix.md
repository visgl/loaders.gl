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

The fixed-frame selector accepts a renderer-independent native frame. The adapter below connects
it to the loaders.gl `Tileset2D` shared cache. A viewport integration and compatible renderer
supply and interpret the frame, bounds and per-axis tile dimensions.

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


## TileMatrix traversal in `Tileset2D`

`createTileMatrixTileset2DAdapter(grid, options)` connects the fixed-frame selector to the
shared [`Tileset2D`](/docs/modules/tiles/api-reference/tileset-2d) cache. It accepts complete
regular or coalesced geometry and an explicit native-CRS frame. It retains opaque matrix IDs,
source coverage, canonical aliases, native bounds, CRS and per-level logical tile dimensions.
`z` is the level from coarse to fine, ordered by descending horizontal resolution (`matrix.resolution`).
Ties keep source order. `tileMatrix` is the native ID. A tile's parent is the tile at the next
coarser level that contains its center. If the center falls outside that matrix or the containing
tile is outside advertised coverage, the adapter returns `null` for the parent.

In a nested grid, each fine tile fits inside a single coarse tile, so its parent covers the full
tile. In a non-nested grid, refinement uses the center-containing parent for best-effort
placeholder coverage. Any part of the fine tile outside that parent has no placeholder from
refinement until the fine tile loads, even if another overlapping coarse tile is cached.

```typescript
import {Tileset2D, createTileMatrixTileset2DAdapter} from '@loaders.gl/tiles/tileset-2d';

const metadata = await tileSource.getMetadata();
if (!metadata.tileGrid) throw new Error('Source has no tile grid');
const adapter = createTileMatrixTileset2DAdapter(metadata.tileGrid, {
  cacheNamespace: 'source-version:style:time',
  maximumTileCount: 4096
});
const tileset = Tileset2D.fromTileSource(tileSource, {adapter});
const indices = tileset.getTileIndices({
  viewState: {crs: 'EPSG:32631', extent: [500000, 5199000, 501000, 5200000], resolution: 2},
  zRange: null
});
const consumer = Symbol('native-frame');
tileset.attachConsumer(consumer);
const tiles = indices.map(index => tileset.getTile(index, true));
tileset.updateConsumer(consumer, tiles, tiles);
const payloads = await Promise.all(tiles.map(tile => tile.data));
// Detach when this consumer no longer needs the tiles.
tileset.detachConsumer(consumer);
```

Use the **exact** CRS identifier from the source grid. `cacheNamespace` identifies the source,
grid version and content dimensions such as style, time and band selection. Change it and replace
the adapter when those change. Treat the grid as immutable while the adapter is in use. A source
or adapter change clears cached tiles and consumer selections so old content cannot be reused.
The namespace is caller-owned and is not a globally unique identifier by itself.

The adapter selects from the native frame and `grid.limits`. An explicitly supplied `extent` clips
the frame in the grid CRS. Source metadata's geographic `boundingBox` is not used as a native
extent, because it may be in a different CRS. Explicit `minZoom` and `maxZoom` restrict the
coarse-to-fine ranks. An integer `zoomOffset` scales the target resolution by
`2 ** -zoomOffset`, including for irregular level spacing.

A frame must already account for the relevant viewport and layer transform. Identity model matrices
are accepted; non-identity matrices and non-null elevation ranges throw instead of silently
producing an incorrect selection. A viewport integration must produce a conservative native frame
for transformed or elevated views before calling the adapter. Numeric `z` remains a compatibility
array index for direct calls to `selectTileMatrixTiles` as described above.

Supply `toLngLat` to add a `getTileOutline` hook for deck.gl culling and request priority. The
adapter is synchronous, so the caller provides a synchronous conversion from the grid CRS to
`[longitude, latitude]`, such as `converter.WGS84.to` from a math.gl CRS descriptor. The hook
samples four segments per tile edge and returns a 16-position ring without a repeated closing
point. It returns `null` if a position cannot be converted to finite longitude and latitude.
The loaders.gl `Tileset2D` uses the tile's native bounding box and does not use the outline.
