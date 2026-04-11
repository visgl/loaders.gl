# Tiles3DSource

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
- eagerly builds the runtime hierarchy from the root tileset JSON
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

### `getTileUrl(tilePath)`

Resolves the final request URL for tile content, including propagated query parameters.
