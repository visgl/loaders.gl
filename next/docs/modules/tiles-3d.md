# 3D tiles

Install `@loaders.gl/tiles-3d` for 3D tileset traversal, 3D Tiles, I3S, COPC and Potree.

```
npm install @loaders.gl/core @loaders.gl/tiles-3d
```

Import `Tileset3D` and `Tile3D` from `@loaders.gl/tiles-3d/tileset`. Spatial and point-cloud helpers have dedicated subpaths. Format loaders and writers use separate subpaths:

```
import {Tileset3D} from '@loaders.gl/tiles-3d/tileset';

import {Tiles3DSource} from '@loaders.gl/tiles-3d/tiles-3d-source';

import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';



const source = new Tiles3DSource({url, loader: Tiles3DLoader});

const tileset = new Tileset3D(source, options);
```

Use `@loaders.gl/tiles-3d/i3s` for I3S and SLPK formats. Import `I3SSource` from `@loaders.gl/tiles-3d/i3s-source`. The older package names `@loaders.gl/3d-tiles` and `@loaders.gl/i3s` are removed in v5.

| Logo                                                                                                                                                  | Format                      | Reference                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | 3D Tiles                    | [3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md) |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | I3S and SLPK                | [I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)           |
| [![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md) | Cloud Optimized Point Cloud | [COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)         |
| —                                                                                                                                                     | Potree                      | [Potree](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)     |

LAS/LAZ, PCD, and PLY file loaders belong to [pointclouds](https://loaders.gl/next/docs/modules/pointclouds.md).

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

## Format guides[​](#format-guides "Direct link to Format guides")

* [3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)
* [COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md)
* [I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)
* [Potree](https://loaders.gl/next/docs/modules/tiles-3d/potree/formats/potree.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->36<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                                                | Import subpath                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles`                                    |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles-archive-writer`                     |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles/bundled`                            |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles/subtree-zod-schema`                 |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles/subtree.schema.json`                |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles/tileset-zod-schema`                 |
| [![](/next/images/format-logos/3d-tiles-logo.png)](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)                   | `@loaders.gl/tiles-3d/3d-tiles/tileset.schema.json`                |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/api`                                         |
| [![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md) | `@loaders.gl/tiles-3d/copc`                                        |
| [![](/next/assets/images/copc-logo-80-4d2cfd37829f50dada1756d82902376f.png)](https://loaders.gl/next/docs/modules/tiles-3d/copc/formats/copc.md) | `@loaders.gl/tiles-3d/copc/bundled`                                |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s`                                         |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s-lepcc-loader`                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s-mesh-writer`                             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s-slpk-writer`                             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s-source`                                  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s-zod-schema`                              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/bundled`                                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-content-worker-node.js`              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-content-worker.js`                   |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-lepcc-worker-node.js`                |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-lepcc-worker.js`                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-node-page.schema.json`               |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-point-cloud-scene-layer.schema.json` |
| [![](/next/images/format-logos/ogc-mark.svg)OGCI3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)                            | `@loaders.gl/tiles-3d/i3s/i3s-scene-layer.schema.json`             |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/point-cloud`                                 |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/point-cloud-tile-loader`                     |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/point-cloud-tile-source`                     |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/point-cloud/bundled`                         |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/potree`                                      |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/potree-loader`                               |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/potree-metadata-schema`                      |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/potree/bundled`                              |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/potree/potree-metadata.schema.json`          |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/spatial`                                     |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/tiles-3d-source`                             |
|                                                                                                                                                       | `@loaders.gl/tiles-3d/tileset`                                     |
