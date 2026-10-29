# 2D tiles

The `@loaders.gl/tiles` root exports `Tileset2D`, `ImageSet`, and `RasterSet`. These APIs select, request, and cache 2D tiles independently of a renderer.

```
import {Tileset2D, RasterSet} from '@loaders.gl/tiles';
```

Import format loaders and writers from separate subpaths:

| Format                          | Import path                 |
| ------------------------------- | --------------------------- |
| MapLibre Tile                   | `@loaders.gl/tiles/mlt`     |
| Mapbox Vector Tile and TileJSON | `@loaders.gl/tiles/mvt`     |
| PMTiles archive                 | `@loaders.gl/tiles/pmtiles` |

Install `@loaders.gl/tiles` once; the subpaths are not separate npm packages. For 3D Tiles and I3S, use [the 3D tiles module](https://loaders.gl/next/docs/modules/tiles-3d.md). The root still reexports `Tileset3D`, `TILE_TYPE`, `TILESET_TYPE`, and `LOD_METRIC_TYPE` for deck.gl 9 compatibility. These deprecated exports will be removed after deck.gl imports the 3D module directly.

See the [`Tileset2D` API](https://loaders.gl/next/docs/modules/tiles/api-reference/tileset-2d.md) and [`RasterSet` API](https://loaders.gl/next/docs/modules/tiles/api-reference/raster-set.md).

For explicit native-CRS frames, see [TileMatrix selection and shared runtime traversal](https://loaders.gl/next/docs/modules/tiles/api-reference/tile-matrix.md). Viewport conversion and projected rendering remain application responsibilities.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
