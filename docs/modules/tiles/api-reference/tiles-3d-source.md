# Tiles3DSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The `Tiles3DSource` class implements [`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source) for datasets loaded with the [Tiles3DLoader](/docs/modules/3d-tiles/api-reference/tiles-3d-loader).

## Usage

```ts
import {Tiles3DLoader} from '@loaders.gl/3d-tiles'
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles'

const source = new Tiles3DSource({
  url: 'https://assets.cesium.com/43978/tileset.json',
  loader: Tiles3DLoader
})

const tileset = new Tileset3D(source)
await tileset.tilesetInitializationPromise
```

## Constructor

```ts
new Tiles3DSource(input, loadOptions?)
```

Parameters:

- `input`
  - `{url, loader, basePath?}` to let the source fetch root metadata itself
  - a preloaded root tileset JSON object for tests or internal callers
- `loadOptions` - loaders.gl options forwarded to metadata and content requests

## Format-Specific Behavior

`Tiles3DSource` adds the 3D Tiles-specific logic that does not belong in `Tileset3D`:

- validates the root `asset` object and version
- propagates root query parameters
- appends `tilesetVersion` as the `v` query parameter
- tracks `session` query parameters found in child content URLs
- builds explicit runtime headers from root JSON while retaining implicit subtrees as lazy references
- requests an implicit subtree only after visibility, request-volume, and SSE eligibility
- deduplicates final subtree URLs and retains a bounded parsed-subtree LRU
- expands nested external tilesets after tile content loads
- exposes `gltfUpAxis`, properties, extras, credits, and extension metadata
- tracks observed content formats such as Draco, Meshopt, and KTX2

## Key Methods

### `initialize()`

Loads root metadata if needed and normalizes the source state consumed by `Tileset3D`.

### `initializeTileHeaders(tileset, tilesetJson, parentTile?)`

Builds the runtime tile subtree for a 3D Tiles payload.

### `loadTileContent(tile)`

Loads tile content and returns a nested tileset payload when the tile points at an external tileset JSON.

### `loadTileChildren(tile, frameState)`

Loads and installs one lazy implicit subtree. Traversal calls this hook only after the tile is visible, inside its viewer request volume, and above the current SSE threshold. Child subtrees remain lazy.

### `getImplicitTilingStats()`

Returns request, parsed-cache, pending, and materialized-header counters for implicit traversal. See [Implicit tiling and lazy subtrees](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees#runtime-diagnostics).

### `getTileUrl(tilePath)`

Resolves the final request URL for tile content, including propagated query parameters.

## Implicit Subtree Cache

Set `loadOptions['3d-tiles'].maximumCachedSubtrees` to the maximum number of settled parsed subtree resources retained by this source. The default is `32`; `0` keeps only active requests long enough to deduplicate them. This metadata cache is independent of `Tileset3D.cacheBytes`.
