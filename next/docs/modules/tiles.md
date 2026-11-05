# 2D tiles

The `@loaders.gl/tiles` root exports `Tileset2D`, `ImageSet`, and `RasterSet`. These APIs select, request, and cache 2D tiles independently of a renderer.

```
import {Tileset2D, RasterSet} from '@loaders.gl/tiles';
```

Import format loaders and writers from separate subpaths:

| Logo | Format                          | Import path                 |
| ---- | ------------------------------- | --------------------------- |
| —    | MapLibre Tile                   | `@loaders.gl/tiles/mlt`     |
| —    | Mapbox Vector Tile and TileJSON | `@loaders.gl/tiles/mvt`     |
| —    | PMTiles archive                 | `@loaders.gl/tiles/pmtiles` |

Install `@loaders.gl/tiles` once; the subpaths are not separate npm packages. For 3D Tiles and I3S, use [the 3D tiles module](https://loaders.gl/next/docs/modules/tiles-3d.md). The root still reexports `Tileset3D`, `TILE_TYPE`, `TILESET_TYPE`, and `LOD_METRIC_TYPE` for deck.gl 9 compatibility. These deprecated exports will be removed after deck.gl imports the 3D module directly.

See the [`Tileset2D` API](https://loaders.gl/next/docs/modules/tiles/api-reference/tileset-2d.md) and [`RasterSet` API](https://loaders.gl/next/docs/modules/tiles/api-reference/raster-set.md).

For explicit native-CRS frames, see [TileMatrix selection and shared runtime traversal](https://loaders.gl/next/docs/modules/tiles/api-reference/tile-matrix.md). Viewport conversion and projected rendering remain application responsibilities.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [MapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)
* [Map Styles](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md)
* [Mapbox Vector Tile](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)
* [TileJSON and Tilestats](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md)
* [PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->17<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                          | Import subpath                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [![](/next/images/format-logos/apache-arrow-logo.png)](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md) | `@loaders.gl/tiles/arrow-table-tile-source-loader` |
|                                                                                                                                 | `@loaders.gl/tiles/mlt`                            |
|                                                                                                                                 | `@loaders.gl/tiles/mlt/bundled`                    |
|                                                                                                                                 | `@loaders.gl/tiles/mlt/unbundled`                  |
|                                                                                                                                 | `@loaders.gl/tiles/mvt`                            |
|                                                                                                                                 | `@loaders.gl/tiles/mvt-geojson-loader`             |
|                                                                                                                                 | `@loaders.gl/tiles/mvt/bundled`                    |
|                                                                                                                                 | `@loaders.gl/tiles/mvt/mvt-worker.js`              |
|                                                                                                                                 | `@loaders.gl/tiles/mvt/tilejson-zod-schema`        |
|                                                                                                                                 | `@loaders.gl/tiles/mvt/tilejson.schema.json`       |
|                                                                                                                                 | `@loaders.gl/tiles/mvt/unbundled`                  |
|                                                                                                                                 | `@loaders.gl/tiles/pmtiles`                        |
|                                                                                                                                 | `@loaders.gl/tiles/pmtiles/bundled`                |
|                                                                                                                                 | `@loaders.gl/tiles/pmtiles/geoarrow`               |
|                                                                                                                                 | `@loaders.gl/tiles/pmtiles/raster`                 |
|                                                                                                                                 | `@loaders.gl/tiles/pmtiles/unbundled`              |
|                                                                                                                                 | `@loaders.gl/tiles/tile-matrix`                    |
