---
title: '@loaders.gl/tiles'
description: Select and cache 2D tiles, and load MLT, MVT, and PMTiles formats.
---

import {FormatLogo} from '@site/src/components/docs/format-logo';
import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';


# 2D tiles

The `@loaders.gl/tiles` root exports `Tileset2D`, `ImageSet`, and `RasterSet`.
These APIs select, request, and cache 2D tiles independently of a renderer.

```ts
import {Tileset2D, RasterSet} from '@loaders.gl/tiles';
```

Import format loaders and writers from separate subpaths:

| Logo | Format | Import path |
| --- | --- | --- |
| — | MapLibre Tile | `@loaders.gl/tiles/mlt` |
| — | Mapbox Vector Tile and TileJSON | `@loaders.gl/tiles/mvt` |
| — | PMTiles archive | `@loaders.gl/tiles/pmtiles` |

Install `@loaders.gl/tiles` once; the subpaths are not separate npm packages.
For 3D Tiles and I3S, use [the 3D tiles module](/docs/modules/tiles-3d).
The root still reexports `Tileset3D`, `TILE_TYPE`, `TILESET_TYPE`, and
`LOD_METRIC_TYPE` for deck.gl 9 compatibility. These deprecated exports will
be removed after deck.gl imports the 3D module directly.

See the [`Tileset2D` API](/docs/modules/tiles/api-reference/tileset-2d)
and [`RasterSet` API](/docs/modules/tiles/api-reference/raster-set).
For shared terrain height fields, see the experimental [`TerrainSource`](/docs/modules/tiles/api-reference/terrain-source).

For explicit native-CRS frames, see [TileMatrix selection and shared runtime traversal](/docs/modules/tiles/api-reference/tile-matrix). Viewport conversion and projected rendering remain application responsibilities.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).


## Format guides

- [MapLibre Tile](./mlt/formats/mlt.md)
- [Map Styles](./mvt/formats/map-style.md)
- [Mapbox Vector Tile](./mvt/formats/mvt.md)
- [TileJSON and Tilestats](./mvt/formats/tilejson.md)
- [PMTiles](./pmtiles/formats/pmtiles.mdx)


## Package exports

<ModuleSubpaths module="tiles" />
