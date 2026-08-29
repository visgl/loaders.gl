---
title: Tiles3DSource
description: Connect a 3D Tiles loader to the shared tileset runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles module · 3D source API"
  title="Tiles3DSource"
  description="Connect a 3D Tiles loader to the shared tileset runtime, handling root metadata, content URLs, implicit subtrees, external tilesets, and format-specific tile state."
  tone="cyan"
  meta={['From v5.0', '3D Tiles source', 'Lazy hierarchy']}
  links={[
    {label: '3D Tiles format', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
    {label: 'Tileset3D', to: '/docs/modules/tiles/api-reference/tileset-3d'},
    {label: 'Tiles module', to: '/docs/modules/tiles'}
  ]}
/>

<DocOrientation
  eyebrow="The source boundary"
  title="Keep format-specific requests out of traversal."
  description="Tiles3DSource owns the 3D Tiles rules; Tileset3D owns traversal, culling, cache management, and scheduling. That separation makes the runtime reusable across formats."
  tone="cyan"
  items={[
    {label: 'Metadata', value: 'Root asset and tileset state'},
    {label: 'Hierarchy', value: 'Explicit and implicit child headers'},
    {label: 'Content', value: 'glTF, binary, external tilesets, and formats'},
    {label: 'Requests', value: 'Versions, sessions, headers, and URLs'}
  ]}
/>

<ReferenceBoundary
  title="Tiles3DSource reference"
  description="The sections below document construction, format-specific behavior, lifecycle methods, and tile content loading."
  tone="cyan"
/>

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
