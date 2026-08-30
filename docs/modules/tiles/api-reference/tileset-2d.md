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
    {label: 'MVT source', to: '/docs/modules/mvt/api-reference/mvt-source-loader'},
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
