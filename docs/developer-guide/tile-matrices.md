# Tile matrices and tile matrix sets

A **tile matrix** describes a rectangular grid at one resolution. A **tile matrix set** groups these grids in one coordinate reference system (CRS). A tile source combines that geometry with a way to retrieve tile content.

This distinction matters outside familiar Web Mercator maps: a projected service can use different origins, tile sizes, and identifiers at each level. Loading a tile successfully does not establish where it belongs on a map.

## Describe one level

| Field | Meaning |
| --- | --- |
| `id` | Identifier sent to the source, such as `coarse` or `EPSG:3857:3` |
| `origin` | Grid corner in normalized X/Y coordinates, in CRS units |
| `cornerOfOrigin` | `topLeft` (rows run down) or `bottomLeft` (rows run up) |
| `resolution` | CRS units represented by one pixel |
| `tileSize` | Tile width and height in pixels |
| `matrixSize` | Grid width and height in tiles |

For a top-left matrix, a tile at column `x`, row `y` spans:

```text
width  = tileSize[0] * resolution
height = tileSize[1] * resolution
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

Known geographic and Web Mercator units are built in. For other CRSs, supply `metersPerUnit` when needed (for example, `1` for meters). This option describes units; it does not transform coordinates. Embedded CRS definitions and unsupported variable-width rows do not become usable rectangular geometry.

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

WMTS and OGC API Tiles share this model today. Other formats may expose partial native grid metadata; consult their support tables rather than assuming every tile source supplies a complete `tileMatrixSet`. 3D spatial trees and arbitrary multidimensional arrays are not automatically two-dimensional tile matrices.

See [WMTS](/docs/modules/wms/formats/wmts), [OGC API Tiles](/docs/modules/wms/services/ogc-api), and [CRS and tile grids](/docs/modules/wms/api-reference/crs-and-tile-grids). Standards: [OGC TileMatrixSet 2.0](https://docs.ogc.org/is/17-083r4/17-083r4.html) and [OGC API Tiles](https://docs.ogc.org/is/20-057/20-057.html).
