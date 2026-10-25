---
title: '@loaders.gl/tiles-3d'
description: Traverse 3D Tiles and I3S datasets with shared 3D tileset runtime APIs.
---

# 3D tiles

Install `@loaders.gl/tiles-3d` for 3D tileset traversal, 3D Tiles, and I3S.

```bash
npm install @loaders.gl/tiles-3d
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

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
