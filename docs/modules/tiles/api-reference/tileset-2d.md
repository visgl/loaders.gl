---
title: Tileset2D
description: Share cache and request state across viewport-driven 2D tile consumers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles module · 2D runtime"
  title="Tileset2D"
  description="A shared runtime for source-backed 2D tile loading, separating reusable fetched content from per-view selection and visibility state."
  tone="cyan"
  meta={['From v5.0', '2D tile runtime', 'Shared cache']}
  links={[
    {label: 'Tiles module', to: '/docs/modules/tiles'},
    {label: 'MVT source', to: '/docs/modules/tiles/mvt/api-reference/mvt-source-loader'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The 2D runtime"
  title="Reuse tile content without sharing view state."
  description="Tileset2D lets multiple consumers share fetched tiles while keeping their own viewport selection, visibility, and traversal state."
  tone="cyan"
  items={[
    {label: 'Content', value: 'Shared cache entries and request results'},
    {label: 'View', value: 'Per-consumer selection and visibility'},
    {label: 'Requests', value: 'Bounded concurrent tile loading'},
    {label: 'Source', value: 'Direct callbacks or a TileSource adapter'}
  ]}
/>

<ReferenceBoundary
  title="Tileset2D reference"
  description="The sections below document construction, source integration, cache limits, zoom range, and lifecycle callbacks."
  tone="cyan"
/>

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
- `maxCacheSize`: tile-count high-water mark, default `100`
- `maxCacheByteSize`: retained-byte high-water mark, unlimited by default
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
- `unloadedTiles`: cache entries whose `isLoaded` flag is false (pending, canceled, or stale)
- `stats`: live counters for cache and consumer state

## Methods

- `attachConsumer(id)`: register a consumer identified by a symbol
- `updateConsumer(id, selectedTiles, visibleTiles)`: update a consumer's retained tiles
- `detachConsumer(id)`: remove a consumer and prune unused requests and cache entries
- `getTileIndices(context)`: select indices through the configured traversal adapter
- `getTile(index, create?)`: access a tile, optionally creating and loading it
- `prepareTiles()`: rebuild cached parent/child links and the sorted `tiles` list
- `setOptions(options)`: update runtime options
- `reloadAll()`: mark selected and visible fallback tiles stale and evict unused entries
- `subscribe(listener)`: observe tile and metadata events
- `finalize()`: abort requests and clear the cache

## Retention and ownership

Each consumer reports its selected tiles and visible fallback tiles. Tiles retained by any consumer
are protected from eviction, so the cache can exceed either high-water mark while all entries are
needed. Unretained tiles are evicted in least-recently-used order. Accessing a tile through `getTile`
updates its recency; rebuilding parent/child relationships does not.

`reloadAll()` preserves selected tiles and visible ancestors or descendants used as fallbacks,
including their existing content, and marks them for loading on the next `getTile(index, true)` call.
Eviction aborts pending requests. Results from canceled requests are ignored even when the source
does not honor its abort signal.

Consumers should call `detachConsumer()` when removed. Only the owner of the shared tileset should
call `finalize()`. Finalization clears all consumers and suppresses late tile and metadata results;
it does not finalize the externally supplied `TileSource`.

## Statistics and notifications

The `stats` property is a probe.gl `Stats` object with these counters:

| Counter | Meaning |
| --- | --- |
| `Tiles In Cache` | Number of cached entries, including pending and failed tiles |
| `Cache Size` | Estimated bytes of retained content |
| `Selected Tiles` | Unique selected tiles across consumers, including unloaded tiles |
| `Visible Tiles` | Unique selected and visible fallback tiles across consumers, including unloaded tiles |
| `Loading Tiles` | Entries with queued or active requests |
| `Unloaded Tiles` | Cumulative evictions since construction or finalization |
| `Consumers` | Number of registered consumers |

`Unloaded Tiles` counts evictions; it is different from the `unloadedTiles` property. Failed requests
are settled entries and are excluded from `unloadedTiles` until marked stale by a reload.

Subscribe with `subscribe({onStatsChange})` and call the returned function to unsubscribe. Direct
tile requests update cache and loading counts immediately; synchronous request notifications are
coalesced into one microtask. Consumer updates, reload, detach, load/error completion, and finalization
publish refreshed counters. Eviction emits `onTileUnload` for each removed tile, then publishes one
consistent statistics snapshot for the batch. Read batch totals in `onStatsChange` rather than in
individual unload callbacks.

## Failed tile caching

Failed tile requests are cached as settled tile entries with:

- `content = null`
- `error` set on the corresponding `SharedTile2DHeader`

This prevents repeated requests for the same failing tile until the tileset is explicitly reloaded,
for example with `reloadAll()`.
