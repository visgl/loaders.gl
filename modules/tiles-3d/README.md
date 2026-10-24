# @loaders.gl/tiles-3d

Three-dimensional tileset traversal and format loaders share this package.

| Entry point | Purpose |
| --- | --- |
| `@loaders.gl/tiles-3d` | `Tileset3D`, `Tile3D`, traversal, spatial helpers, and point-cloud tilesets |
| `@loaders.gl/tiles-3d/3d-tiles` | 3D Tiles loaders, archives, and writers |
| `@loaders.gl/tiles-3d/i3s` | I3S loaders, SLPK archives, and writers |
| `@loaders.gl/tiles-3d/copc` | COPC point-cloud source, hierarchy, and writer |
| `@loaders.gl/tiles-3d/potree` | Potree point-cloud loaders, source, and writer |

Install `@loaders.gl/tiles-3d` once, then import the format subpath you use.

## Source-backed tilesets

`Tileset3D` now supports source-backed construction for format-specific loading behavior while keeping traversal and culling logic in the shared runtime.

```ts
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';

const source = new Tiles3DSource({url, loader: Tiles3DLoader});
const tileset = new Tileset3D(source, options);
```

Available source classes:

- `Tiles3DSource` for 3D Tiles datasets
- `I3SSource` for I3S datasets

Archive-backed `.3tz` and `.slpk` datasets use the same source classes through archive-aware
source construction helpers. Archive parsing stays in the `@loaders.gl/tiles-3d/3d-tiles` and
`@loaders.gl/tiles-3d/i3s` packages rather than being duplicated in `@loaders.gl/tiles`.

`Tileset3D` now requires an explicit source instance. Root metadata loading and normalization happen inside the source implementation.

The shared `Tileset3DSource` contract owns:

- root metadata loading and normalization
- runtime tile-header creation
- tile content URL resolution
- tile content fetching
- format-specific view-state metadata
- format-specific post-load bookkeeping

`Tileset3D` remains responsible for traversal, culling, request scheduling, selection, and cache management.

### Camera-independent content traversal

Conversion and inspection jobs can visit the complete dataset without creating a viewport:

```ts
import {traverseTilesetContents} from '@loaders.gl/tiles-3d';

for await (const {tile, contents} of traverseTilesetContents(tileset, {signal})) {
  // `contents` preserves the tile's declared content order.
  processTile(tile, contents);
}
```

The traversal follows declared placements in depth-first order, resolves lazy 3D Tiles subtrees and
I3S child headers through their source, and visits nested tilesets before descending into them.
Repeated resource URLs remain separate visits when they appear at different placements, since each
placement can have its own transform. By default, the caller owns loaded-content lifetime and
should unload or destroy the tileset when processing completes.

Pass `{signal, unloadContent: true}` with a runtime dedicated to traversal to unload newly read
content when the iterator advances or closes, including on cancellation and errors. Preloaded
content is retained. Finish processing each placement before requesting the next one; do not retain
payloads or concurrently update the runtime. Tile placements and children remain available, and the
caller still owns tileset destruction and source/archive lifetimes. This limits content retention,
not decoder allocations, source caches, or the full dataset's metadata.

For broader documentation please visit the [website](https://loaders.gl).
