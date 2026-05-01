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

Archive-backed `.3tz` and `.slpk` datasets use the same source classes through archive-aware
source construction helpers. Archive parsing stays in the `@loaders.gl/3d-tiles` and
`@loaders.gl/i3s` packages rather than being duplicated in `@loaders.gl/tiles`.

`Tileset3D` now requires an explicit source instance. Root metadata loading and normalization happen inside the source implementation.

The shared `Tileset3DSource` contract owns:

- root metadata loading and normalization
- runtime tile-header creation
- tile content URL resolution
- tile content fetching
- format-specific view-state metadata
- format-specific post-load bookkeeping

`Tileset3D` remains responsible for traversal, culling, request scheduling, selection, and cache management.

For broader documentation please visit the [website](https://loaders.gl).

## Tileset2D

`Tileset2D` is the shared cache and loading engine for source-backed 2D tile rendering.

API reference: [`Tileset2D`](../../docs/modules/tiles/api-reference/tileset-2d.md)

Its purpose is to separate:

- shared tile content, request scheduling, and cache eviction
- per-view selection and visibility state

That lets multiple layers and views reuse the same tile cache without duplicating requests or
overwriting each other's traversal state.

### Installation

```ts
import {
  Tileset2D,
  type Tileset2DProps,
  type TileLoadProps
} from '@loaders.gl/tiles';
```

### Construct from `getTileData`

```ts
const tileset = new Tileset2D({
  getTileData: async ({id, bbox}: TileLoadProps) => fetchTile(id, bbox),
  maxZoom: 14,
  maxCacheSize: 256
});
```

### Construct from a loaders.gl `TileSource`

```ts
import type {TileSource} from '@loaders.gl/loader-utils';
import {Tileset2D} from '@loaders.gl/tiles';

const tileSource: TileSource = createTileSourceSomehow();
const tileset = Tileset2D.fromTileSource(tileSource, {
  maxCacheByteSize: 32 * 1024 * 1024
});
```

When backed by a `TileSource`, the tileset reads metadata once and adopts:

- `minZoom`
- `maxZoom`
- `boundingBox` mapped to `extent`

Explicit options still override source metadata.

### Key API

- `tiles`: current contents of the shared tile cache
- `selectedTiles` / `visibleTiles`: union views across all attached consumers
- `loadingTiles` / `unloadedTiles`: current loading and unloaded cache subsets
- `stats`: live `@probe.gl/stats` counters for cache size, selection, visibility, and consumers
- `subscribe(listener)`: tile lifecycle, metadata update, and stats callbacks
- `setOptions(opts)`: update runtime configuration
- `reloadAll()`: mark retained tiles stale for reload
- `finalize()`: abort requests and clear the cache

The shared stats currently populate:

- `Tiles In Cache`
- `Cache Size`
- `Visible Tiles`
- `Selected Tiles`
- `Loading Tiles`
- `Unloaded Tiles`
- `Consumers`
