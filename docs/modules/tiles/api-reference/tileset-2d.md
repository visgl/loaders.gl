# Tileset2D

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

`Tileset2D` is the shared runtime for source-backed 2D tile loading in loaders.gl.

It separates:

- shared tile cache entries and request scheduling
- per-view tile selection and visibility state

That lets multiple consumers reuse the same fetched tile content without duplicating requests or
overwriting each other's traversal state.

## Usage

```typescript
import {Tileset2D} from '@loaders.gl/tiles';

const tileset = new Tileset2D({
  getTileData: async ({index, signal}) => fetchTile(index, signal),
  minZoom: 0,
  maxZoom: 14
});
```

You can also construct it directly from a loaders.gl `TileSource`.

```typescript
import {Tileset2D} from '@loaders.gl/tiles';

const tileset = Tileset2D.fromTileSource(tileSource, {
  maxCacheByteSize: 32 * 1024 * 1024
});
```

When constructed from a `TileSource`, `Tileset2D` loads source metadata once and adopts:

- `minZoom`
- `maxZoom`
- `boundingBox` as `extent`

Explicit constructor options still take precedence.

## Constructor

```typescript
new Tileset2D(options)
```

Key options:

- `getTileData`: async tile loader
- `minZoom` / `maxZoom`: requested zoom range
- `extent`: optional bounding box limit
- `tileSize`: tile size in pixels
- `maxCacheSize`: maximum retained tile count
- `maxCacheByteSize`: maximum retained tile bytes
- `maxRequests`: concurrent request limit
- `debounceTime`: request scheduling debounce in milliseconds
- `zoomOffset`: integer zoom adjustment
- `onTileLoad`: callback after a tile loads successfully
- `onTileUnload`: callback after a tile is evicted
- `onTileError`: callback after a tile load fails

## Properties

- `tiles`: current shared tile cache contents
- `selectedTiles`: selected tiles across attached views
- `visibleTiles`: visible tiles across attached views
- `loadingTiles`: cache entries with in-flight requests
- `unloadedTiles`: cache entries without content
- `stats`: live counters for cache and consumer state

## Methods

- `attach({id, viewport, modelMatrix})`: attach or update a consumer view
- `detach(id)`: remove a consumer view
- `setOptions(options)`: update runtime options
- `update(id)`: refresh tile selection for a consumer view
- `reloadAll()`: mark retained tiles stale for reload
- `subscribe(listener)`: observe tile and metadata events
- `finalize()`: abort requests and clear the cache

## Failed tile caching

Failed tile requests are cached as settled tile entries with:

- `content = null`
- `error` set on the corresponding `SharedTile2DHeader`

This prevents repeated requests for the same failing tile until the tileset is explicitly reloaded,
for example with `reloadAll()`.
