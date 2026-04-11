# I3SSource

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The `I3SSource` class implements [`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source) for datasets loaded with the [I3SLoader](/docs/modules/i3s/api-reference/i3s-loader).

## Usage

```ts
import {I3SLoader} from '@loaders.gl/i3s'
import {I3SSource, Tileset3D} from '@loaders.gl/tiles'

const source = new I3SSource({
  url: 'https://tiles.arcgis.com/.../SceneServer/layers/0',
  loader: I3SLoader
})

const tileset = new Tileset3D(source)
await tileset.tilesetInitializationPromise
```

## Constructor

```ts
new I3SSource(input, loadOptions?)
```

Parameters:

- `input`
  - `{url, loader, basePath?}` to let the source fetch root metadata itself
  - a preloaded root tileset JSON object for tests or internal callers
- `loadOptions` - loaders.gl options forwarded to metadata, node-header, and content requests

## Format-Specific Behavior

`I3SSource` adds the I3S-specific logic that does not belong in `Tileset3D`:

- loads and normalizes root layer metadata
- propagates `i3s.token` into tile and node requests
- creates the I3S traversal implementation
- fetches child tile headers lazily from node pages or `/nodes/{id}`
- assembles tile-loader `_tileOptions` and `_tilesetOptions`
- derives view state from `fullExtent` or `store.extent`
- tracks observed content formats such as Draco, DDS, and KTX2

## Key Methods

### `initialize()`

Loads root metadata if needed and normalizes the source state consumed by `Tileset3D`.

### `loadChildTileHeader(parentTile, childId, frameState)`

Loads child headers on demand using I3S node pages or node resources.

### `loadTileContent(tile)`

Loads tile content with the I3S-specific tile and tileset loader options assembled by the source.

### `getTileUrl(tilePath)`

Resolves the final request URL for I3S resources, including propagated authentication tokens.
