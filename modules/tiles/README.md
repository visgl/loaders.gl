# @loaders.gl/tiles

Two-dimensional tilesets and tiled-data formats share this package. Import the
selection and cache runtime from the root, and import each format from its own
subpath so a format-specific decoder is loaded only when needed.

| Entry point | Purpose |
| --- | --- |
| `@loaders.gl/tiles` | `Tileset2D`, `ImageSet`, and `RasterSet` |
| `@loaders.gl/tiles/mlt` | MapLibre Tile (MLT) loaders and writers |
| `@loaders.gl/tiles/mvt` | Mapbox Vector Tile, TileJSON, and map-style APIs |
| `@loaders.gl/tiles/pmtiles` | PMTiles archives and source loaders |

The 3D runtime and 3D Tiles/I3S formats live in `@loaders.gl/tiles-3d`.
For deck.gl 9 compatibility, the root temporarily reexports `Tileset3D`,
`TILE_TYPE`, `TILESET_TYPE`, and `LOD_METRIC_TYPE` from that package. New code
should import these symbols from `@loaders.gl/tiles-3d`.

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
import {Tileset2D, type Tileset2DProps, type TileLoadProps} from '@loaders.gl/tiles';
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
import type {TileSource} from '@loaders.gl/core/loader-utils';
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
- `stats`: live `probe.gl/stats` counters for cache size, selection, visibility, and consumers
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

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
