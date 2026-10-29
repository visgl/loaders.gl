Tiles module · 3D source API

# Tiles3DSource

Connect a 3D Tiles loader to the shared tileset runtime, handling root metadata, content URLs, implicit subtrees, external tilesets, and format-specific tile state.

[3D Tiles format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)[Tileset3D](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)[Tiles module](https://loaders.gl/next/docs/modules/tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles.md)

The source boundary

## Keep format-specific requests out of traversal.

Tiles3DSource owns the 3D Tiles rules; Tileset3D owns traversal, culling, cache management, and scheduling. That separation makes the runtime reusable across formats.

01

Metadata

Root asset and tileset state

02

Hierarchy

Explicit and implicit child headers

03

Content

glTF, binary, external tilesets, and formats

04

Requests

Versions, sessions, headers, and URLs

Detailed guide

## Tiles3DSource reference

The sections below document construction, format-specific behavior, lifecycle methods, and tile content loading.

The `Tiles3DSource` class implements [`Tileset3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d-source.md) for datasets loaded with the [Tiles3DLoader](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md).

## Usage[​](#usage "Direct link to Usage")

```
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles'

import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';



const source = new Tiles3DSource({

  url: 'https://assets.cesium.com/43978/tileset.json',

  loader: Tiles3DLoader

})



const tileset = new Tileset3D(source)

await tileset.tilesetInitializationPromise
```

## Constructor[​](#constructor "Direct link to Constructor")

```
new Tiles3DSource(input, loadOptions?)
```

Parameters:

* `input`

  * `{url, loader, basePath?}` to let the source fetch root metadata itself
  * a preloaded root tileset JSON object for tests or internal callers

* `loadOptions` - loaders.gl options forwarded to metadata and content requests

## Format-Specific Behavior[​](#format-specific-behavior "Direct link to Format-Specific Behavior")

`Tiles3DSource` adds the 3D Tiles-specific logic that does not belong in `Tileset3D`:

* validates the root `asset` object and version
* propagates root query parameters
* appends `tilesetVersion` as the `v` query parameter
* tracks `session` query parameters found in child content URLs
* builds explicit runtime headers from root JSON while retaining implicit subtrees as lazy references
* requests an implicit subtree only after visibility, request-volume, and SSE eligibility
* deduplicates final subtree URLs and retains a bounded parsed-subtree LRU
* expands nested external tilesets after tile content loads
* exposes `gltfUpAxis`, properties, extras, credits, and extension metadata
* tracks observed content formats such as Draco, Meshopt, and KTX2

## Key Methods[​](#key-methods "Direct link to Key Methods")

### `initialize()`[​](#initialize "Direct link to initialize")

Loads root metadata if needed and normalizes the source state consumed by `Tileset3D`.

### `initializeTileHeaders(tileset, tilesetJson, parentTile?)`[​](#initializetileheaderstileset-tilesetjson-parenttile "Direct link to initializetileheaderstileset-tilesetjson-parenttile")

Builds the runtime tile subtree for a 3D Tiles payload.

### `loadTileContent(tile)`[​](#loadtilecontenttile "Direct link to loadtilecontenttile")

Loads tile content and returns a nested tileset payload when the tile points at an external tileset JSON.

### `loadTileChildren(tile, frameState)`[​](#loadtilechildrentile-framestate "Direct link to loadtilechildrentile-framestate")

Loads and installs one lazy implicit subtree. Traversal calls this hook only after the tile is visible, inside its viewer request volume, and above the current SSE threshold. Child subtrees remain lazy.

### `getImplicitTilingStats()`[​](#getimplicittilingstats "Direct link to getimplicittilingstats")

Returns request, parsed-cache, pending, and materialized-header counters for implicit traversal. See [Implicit tiling and lazy subtrees](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/implicit-tiling-and-subtrees.md#runtime-diagnostics).

### `getTileUrl(tilePath)`[​](#gettileurltilepath "Direct link to gettileurltilepath")

Resolves the final request URL for tile content, including propagated query parameters.

## Implicit Subtree Cache[​](#implicit-subtree-cache "Direct link to Implicit Subtree Cache")

Set `loadOptions['3d-tiles'].maximumCachedSubtrees` to the maximum number of settled parsed subtree resources retained by this source. The default is `32`; `0` keeps only active requests long enough to deduplicate them. This metadata cache is independent of `Tileset3D.cacheBytes`.
