# @loaders.gl/tiles

This module contains the common components for tiles loaders, i.e. [3D tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles).

[loaders.gl](https://loaders.gl/docs) is a collection of loaders for big data visualizations.

## Source-backed tilesets

`Tileset3D` now supports source-backed construction for format-specific loading behavior while keeping traversal and culling logic in the shared runtime.

```ts
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const source = new Tiles3DSource({url, loader: Tiles3DLoader});
const tileset = new Tileset3D(source, options);
```

Available source classes:

- `Tiles3DSource` for 3D Tiles datasets
- `I3SSource` for I3S datasets

`Tileset3D` now requires an explicit source instance. Root metadata loading and normalization happen inside the source implementation.

For broader documentation please visit the [website](https://loaders.gl).
