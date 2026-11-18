---
title: TerrainSource
description: Share decoded terrain tiles across independent views.
---

# TerrainSource (experimental)

`TerrainSource` adapts a terrain tile provider to one shared `Tileset2D`. It stores
metric height fields in the shared cache while each consumer supplies its own tile
selection and visibility. A provider is responsible for fetching and decoding source
images and supplying their affine frame, validity, registration, and height reference.
Use loaders.gl's `decodeTerrainHeightmap` for RGB elevation images.

```ts
import {TerrainSource} from '@loaders.gl/tiles/terrain';

const source = new TerrainSource({
  metadata: {minZoom: 0, maxZoom: 14},
  // Fetch and decode this tile into math.gl HeightFieldProps. Forward signal to fetch.
  loadTile: async ({x, y, z, tileMatrix, signal}) => loadDecodedHeightField(x, y, z, {tileMatrix, signal}),
  // Supply the renderer's traversal adapter here.
  tileset: {adapter, maxCacheSize: 100}
});

// Reuse source.tileset across views/layers; each consumer attaches and updates its own selection.
// A loaded tile's content exposes a math.gl HeightField, createMesh(), createGeometry(), and createBounds().
```

`getTile` accepts a flat XYZ/native matrix address; `getTileData` adapts the deck.gl
request shape. Direct calls load directly; shared deduplication, request scheduling,
LRU and consumer pinning are provided by `source.tileset`. Each source owns one
cache. Call `source.finalize()` when all consumers are detached.

The provider must return coordinates and heights in a consistent local metric frame.
Math.gl copies the source arrays, preserves validity and registration, and does not
convert CRS or vertical datums. Tile content's `byteLength` counts retained height and
validity arrays; separately created meshes, bounds hierarchies, GPU resources and
provider-owned buffers are not included. `createGeometry()` returns positions relative
to its `origin`; a rendering adapter must apply that translation and handle projection.

Cross-tile seam selection, LOD transitions and GPU resources are not owned by the
source. A view coordinator can call `reconcileTerrainTiles` from the same subpath
with its active, same-matrix vertex tiles. It returns detached fields and diagnostics
using math.gl's shared-vertex reconciliation; it does not mutate cached fields or
stitch different LODs. `HeightFieldMinMax` and field height ranges describe source
samples, not visual skirts or a guarantee of complete coverage.
The source does not currently provide a URL-template or PMTiles decoder; applications
can adapt existing loaders and tile sources in `loadTile`.

Current deck.gl has its own `Tileset2D` implementation. It can consume `TerrainSource`
as a `TileSource`, but cannot directly reuse this loaders.gl tileset instance. A deck.gl
adapter must share one deck.gl tileset between its layers and views, apply the geometry
origin and projection, and convert the tile geometry to the expected layer data. Using
both caches simultaneously does not share tile entries across them.
