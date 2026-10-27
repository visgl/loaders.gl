# Tile matrices and tile matrix sets

A **tile matrix** describes a rectangular grid at one resolution. A **tile matrix set** groups these grids in one coordinate reference system (CRS). A tile source combines that geometry with a way to retrieve tile content.

This distinction matters outside familiar Web Mercator maps: a projected service can use different origins, tile sizes, and identifiers at each level. Loading a tile successfully does not establish where it belongs on a map.

## Describe one level

| Field | Meaning |
| --- | --- |
| `id` | Identifier sent to the source, such as `coarse` or `EPSG:3857:3` |
| `origin` | Grid corner in normalized X/Y coordinates, in CRS units |
| `cornerOfOrigin` | `topLeft` (rows run down) or `bottomLeft` (rows run up) |
| `resolution` | Horizontal CRS units represented by one pixel; also vertical unless `resolutionY` is supplied |
| `resolutionY` | Optional vertical CRS units represented by one pixel |
| `tileSize` | Tile width and height in pixels |
| `matrixSize` | Grid width and height in tiles |

For a top-left matrix, a tile at column `x`, row `y` spans:

```text
width  = tileSize[0] * resolution
height = tileSize[1] * (resolutionY ?? resolution)
minX   = origin[0] + x * width
maxY   = origin[1] - y * height
bounds = [minX, maxY - height, minX + width, maxY]
```

For a bottom-left origin, `minY = origin[1] + y * height`. Use math.gl's `getTileBounds()` instead of reproducing these calculations in application code.

## Matrix identifiers are not zoom numbers

The OGC request placeholders `{tileMatrix}`, `{tileRow}`, and `{tileCol}` address a matrix identifier, row, and column. The familiar `{z}/{x}/{y}` convention is one particular addressing scheme.

Use `tileMatrix` to select an exact advertised identifier. For compatibility, without it loaders.gl selects the matrix whose identifier equals `String(z)`, then falls back to array index `z`. Consequently, `z: 0` does not necessarily select the first advertised matrix: a later matrix named `"0"` takes precedence. An explicit identifier takes precedence; sources with loaded matrix metadata reject unknown identifiers.

```ts
await source.getTile({tileMatrix: 'coarse', z: 0, x: 1, y: 2});
```

`z` remains required by the shared request type and remains numeric in XYZ placeholders. Matrix identifiers are encoded as URL components.

## Read normalized geometry

WMTS and OGC API Tiles expose a `tileGrid` through `getMetadata()`:

- `tileGrid.tileMatrixSet` contains complete, validated math.gl geometry. Prefer it for bounds and indexing.
- `tileGrid.matrices` retains normalized advertised levels, which may be incomplete. Unknown resolution or missing dimensions must not be guessed.
- Legacy fields such as `origin` and `tileSize` describe the first level. They do not describe every matrix in an irregular pyramid. A bottom-left first level has no legacy top-left `origin`.

```ts
import {getTileBounds} from '@math.gl/geospatial';

const {tileGrid} = await source.getMetadata();
const matrix = tileGrid?.tileMatrixSet?.matrices.find(level => level.id === 'coarse');
if (!matrix) throw new Error('The source has no complete geometry for coarse');
const bounds = getTileBounds(matrix, 1, 2);
```

## CRS, axis order, and resolution

Origins are normalized to X/Y where the source knows the axis order. OGC TileMatrixSet JSON honors `orderedAxes`; without it, the service helper recognizes the latitude-first EPSG:4326 convention. CRS84 is longitude first. Other axis conventions require explicit metadata; axis swapping is not reprojection.

JSON `cellSize` directly supplies resolution. A scale denominator uses the OGC nominal pixel size:

```text
resolution = scaleDenominator * 0.00028 / metersPerUnit
```

Known geographic and Web Mercator units are built in. For other CRSs, supply `metersPerUnit` when needed (for example, `1` for meters). This option describes units; it does not transform coordinates. Embedded CRS definitions alone do not establish complete geometry. Coalesced row bands are retained and validated when the required matrix geometry is available.

## Examples of different grids

| Grid | Example geometry | Consequence |
| --- | --- | --- |
| Web Mercator | Meter coordinates; familiar global quad pyramid | Common XYZ clients can use compatible levels |
| CRS84 | Longitude/latitude coordinates; a global level may be two tiles wide and one high | Do not assume a square `2^z` matrix |
| Projected national grid | Meter origin such as `[200000, 4600000]`; named levels | Use each level's own origin, resolution, and dimensions |
| Bottom-left projected grid | Origin `[200000, 4000000]`, 512-pixel tiles, resolution 280 | Row 1 begins 143360 CRS units above the origin |

## Geometry and availability

A matrix describes all possible tile positions. A particular layer or tileset may cover only a subset, advertised through matrix limits. Those limits use inclusive row and column bounds and are associated with matrix identifiers. They do not change tile geometry.

A present limits list restricts availability to its listed matrices; an empty list allows no tiles. An absent list imposes no additional coverage restriction. Matrix dimensions still constrain requests when known. Availability metadata cannot promise that every allowed tile contains nonempty content.

WMTS and OGC API Tiles return `null` for unavailable tile content without issuing a tile request. Their URL-building methods throw for an unavailable position. Load asynchronous source metadata before making synchronous availability or URL queries.

## Loading and rendering are separate

A source can expose a projected matrix set even when the consuming renderer expects a Web Mercator XYZ grid. Correct rendering requires compatible tile selection, bounds, and coordinate transformation. TileMatrix metadata does not automatically reproject raster pixels or enable a different deck.gl view.

WMTS and OGC API Tiles share this model. ArcGIS exposes partial per-level grids, while GeoPackage tile-table metadata can expose complete geometry with independent horizontal and vertical pixel sizes. Other formats may expose partial native grid metadata; consult their support tables rather than assuming every tile source supplies a complete `tileMatrixSet`. 3D spatial trees and arbitrary multidimensional arrays are not automatically two-dimensional tile matrices.

See [WMTS](/docs/modules/ogc/wms/formats/wmts), [OGC API Tiles](/docs/modules/ogc/wms/services/ogc-api), and [CRS and tile grids](/docs/modules/ogc/wms/api-reference/crs-and-tile-grids). Standards: [OGC TileMatrixSet 2.0](https://docs.ogc.org/is/17-083r4/17-083r4.html) and [OGC API Tiles](https://docs.ogc.org/is/20-057/20-057.html).

## GeoPackage payloads and GeoTIFF storage tiles

GeoPackage sources expose explicit-table `getTile()` lookups for bounded encoded payloads. Missing rows return `null`; matrix geometry does not imply that every position is populated. See [GeoPackageSource](/docs/modules/geospatial/geopackage/api-reference/geopackage-source).

GeoTIFF/COG raster sources expose optional `tileGrid` metadata for representable tiled overview hierarchies. Native IFD identifiers, unequal pixel sizes, and padded edge tiles are preserved. Stripped or rotated hierarchies retain their native raster APIs without an invented tile matrix. See [GeoTIFFSourceLoader](/docs/modules/raster/geotiff/api-reference/geotiff-source-loader).

## Requesting a non-default grid through an image source

An image service that accepts bounds in the source CRS can be wrapped with `TileSourceAdapter`
from `@loaders.gl/core/loader-utils`. Supply a complete grid; the adapter forwards native bounds,
per-level pixel dimensions, layers, styling, CRS, and cancellation without reprojection.

```typescript
import {createTileGrid, TileSourceAdapter} from '@loaders.gl/core/loader-utils';

const grid = createTileGrid('EPSG:32610', [{
  id: 'survey',
  origin: [500000, 4200000],
  resolution: 2,
  resolutionY: 3,
  cornerOfOrigin: 'bottomLeft',
  tileSize: [256, 128],
  matrixSize: [4, 3]
}]);
const tiles = new TileSourceAdapter(imageSource, grid);
const image = await tiles.getTile({z: 0, x: 1, y: 1, tileMatrix: 'survey'});
// Requests [500512, 4200384, 501024, 4200768] in EPSG:32610, at 256 x 128 pixels.
```

The image source must support the supplied CRS and bounds. Inclusive `grid.limits` are checked
before requesting pixels. Explicit matrix IDs are independent of `z`; the deck.gl-compatible
request shape also accepts top-level `tileMatrix` and preserves its abort signal. Generated table
tilers resolve canonical numeric matrix IDs before clipping and coordinate conversion, and reject
unknown or aliased identifiers. ArcGIS dynamic MapServer and ImageServer exports require
`tileMatrix` to match the numeric XYZ zoom; cached MapServer requests can use native LOD IDs.
With no grid,
the legacy adapter uses geographic longitude/latitude bounds for canonical XYZ indices.

### Renderer compatibility

The default `@loaders.gl/deck-layers` tile adapter uses deck.gl's Web Mercator XYZ selector. For
complete grids it recognizes EPSG:3857 and its standard OGC URI/URN identifiers, requires
contiguous canonical XYZ levels and square logical tile sizes, and
uses the declared pixel size and zoom range. It rejects projected, bottom-left, irregular, or
renamed matrix geometry with guidance to use a compatible custom selector and projection.
Partial metadata does not broaden existing rendering support. Native source requests and
geometry utilities remain available for these grids; exposing their metadata does not reproject
pixels or select tiles in a different deck.gl view. Availability checks belong to the source,
not to a renderer's assumption that every tile exists.

## Explicit frame selection

For complete regular or coalesced grids, [`selectTileMatrixTiles`](/docs/modules/tiles/api-reference/tile-matrix) accepts an extent and resolution already expressed in the grid CRS, applies advertised limits, and returns native source requests. Our current thinking is that this may be a useful renderer-independent boundary. It does not yet connect arbitrary matrix sets to `Tileset2D` or enable projected rendering. The fixed-frame OGC walkthrough provides a small, tested example for discussing that next step.


## Shared validation and coalesced requests

`getTileGridValidation` distinguishes complete geometry, partial advertised metadata and invalid
geometry or coverage, with diagnostics. `validateTileGrid` rejects invalid inputs while allowing
partial metadata; `resolveTileGridTile` applies shared matrix identity and coverage rules.
See [grid utilities](/docs/modules/core/loader-utils/api-reference/tile-grid).

OGC API Tiles preserves `variableMatrixWidths` in native row numbering, regardless of coordinate
axis normalization. Fixed-frame selection enumerates canonical columns only. OGC URLs and the
explicit image adapter use the same coalesced footprint/coverage semantics, including a canonical
column before the minimum covered alias. No source dimensions, CRS equivalence, or renderer
capabilities are inferred. Coalesced requests require complete geometry; partial metadata remains
inspectable. WMTS variable-width extensions are not parsed by this change.
