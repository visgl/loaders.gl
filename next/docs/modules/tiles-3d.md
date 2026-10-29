# 3D tiles

Install `@loaders.gl/tiles-3d` for 3D tileset traversal, 3D Tiles, I3S, COPC and Potree.

```
npm install @loaders.gl/core @loaders.gl/tiles-3d
```

The root exports `Tileset3D`, `Tile3D`, `Tiles3DSource`, `I3SSource`, spatial helpers, and point-cloud tileset APIs. Format loaders and writers use separate subpaths:

```
import {Tileset3D, Tiles3DSource} from '@loaders.gl/tiles-3d';

import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';



const source = new Tiles3DSource({url, loader: Tiles3DLoader});

const tileset = new Tileset3D(source, options);
```

Use `@loaders.gl/tiles-3d/i3s` for I3S and SLPK formats. The older package names `@loaders.gl/3d-tiles` and `@loaders.gl/i3s` are removed in v5.

| Format                      | Reference                                                                  |
| --------------------------- | -------------------------------------------------------------------------- |
| 3D Tiles                    | [3D Tiles](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md) |
| I3S and SLPK                | [I3S](https://loaders.gl/next/docs/modules/tiles-3d/i3s.md)           |
| Cloud Optimized Point Cloud | [COPC](https://loaders.gl/next/docs/modules/tiles-3d/copc.md)         |
| Potree                      | [Potree](https://loaders.gl/next/docs/modules/tiles-3d/potree.md)     |

LAS/LAZ, PCD, and PLY file loaders belong to [pointclouds](https://loaders.gl/next/docs/modules/pointclouds.md).

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
