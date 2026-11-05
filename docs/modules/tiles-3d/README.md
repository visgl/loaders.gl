---
title: '@loaders.gl/tiles-3d'
description: Traverse 3D Tiles, I3S, COPC and Potree datasets with shared 3D tileset runtime APIs.
---

import {FormatLogo} from '@site/src/components/docs/format-logo';
import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';


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

| Logo | Format | Reference |
| --- | --- | --- |
| <FormatLogo slug="3d-tiles" /> | 3D Tiles | [3D Tiles](./3d-tiles/README.md) |
| <FormatLogo slug="i3s" /> | I3S and SLPK | [I3S](./i3s/README.md) |
| <FormatLogo slug="copc" /> | Cloud Optimized Point Cloud | [COPC](./copc/README.md) |
| — | Potree | [Potree](./potree/README.md) |

LAS/LAZ, PCD, and PLY file loaders belong to [pointclouds](../pointclouds/README.md).

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/tiles-3d/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).


## Format guides

- [3D Tiles](./3d-tiles/formats/3d-tiles.md)
- [COPC](./copc/formats/copc.md)
- [I3S](./i3s/formats/i3s.md)
- [Potree](./potree/formats/potree.md)


## Package exports

<ModuleSubpaths module="tiles-3d" />
