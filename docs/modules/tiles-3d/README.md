---
title: '@loaders.gl/tiles-3d'
description: Traverse 3D Tiles, I3S, COPC and Potree datasets with shared 3D tileset runtime APIs.
---

# 3D tiles

Install `@loaders.gl/tiles-3d` for 3D tileset traversal, 3D Tiles, I3S, COPC and Potree.

```bash
npm install @loaders.gl/core @loaders.gl/tiles-3d
```

The root exports `Tileset3D`, `Tile3D`, `Tiles3DSource`, `I3SSource`, spatial helpers,
and point-cloud tileset APIs. Format loaders and writers use separate subpaths:

```ts
import {Tileset3D, Tiles3DSource} from '@loaders.gl/tiles-3d';
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';

const source = new Tiles3DSource({url, loader: Tiles3DLoader});
const tileset = new Tileset3D(source, options);
```

Use `@loaders.gl/tiles-3d/i3s` for I3S and SLPK formats. The older package
names `@loaders.gl/3d-tiles` and `@loaders.gl/i3s` are removed in v5.

| Format | Reference |
| --- | --- |
| 3D Tiles | [3D Tiles](./3d-tiles/README.md) |
| I3S and SLPK | [I3S](./i3s/README.md) |
| Cloud Optimized Point Cloud | [COPC](./copc/README.md) |
| Potree | [Potree](./potree/README.md) |

LAS/LAZ, PCD, and PLY file loaders belong to [pointclouds](../pointclouds/README.md).
