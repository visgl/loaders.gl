# Tileset3DSource

The `Tileset3DSource` interface defines the format-specific contract consumed by [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d).

`Tileset3D` owns traversal, culling, request scheduling, cache management, and selected-tile state. A `Tileset3DSource` owns the format-specific work required to make those runtime systems operate on a concrete dataset.

## Responsibilities

A `Tileset3DSource` implementation is responsible for:

- loading and normalizing root metadata
- creating runtime tile headers
- resolving tile content URLs
- loading tile content
- deriving format-specific view state metadata
- performing format-specific bookkeeping after tile content loads

## Lifecycle

`Tileset3D` uses the source in this order:

1. `initialize()` loads and normalizes root metadata
2. `getRootTileset()` returns the normalized root payload
3. `initializeTileHeaders()` creates the runtime tile tree
4. `createTraverser()` provides the traversal implementation
5. `loadTileContent()` fetches content for selected tiles
6. `onTileLoaded()` optionally updates format-specific state

## Core Shape

```ts
export interface Tileset3DSource {
  initialize(): Promise<void>
  getMetadata(): TilesetSourceMetadata
  getRootTileset(): Promise<TilesetJSON>
  initializeTileHeaders(
    tileset: Tileset3D,
    tilesetJson: TilesetJSON,
    parentTile?: Tile3D | null
  ): Tile3D
  createTraverser(options: TilesetTraverserProps): TilesetTraverser
  loadTileContent(tile: Tile3D): Promise<TileContentLoadResult>
  getTileUrl(tilePath: string): string
  getViewState(rootTile: Tile3D | null): TilesetSourceViewState
  loadChildTileHeader?(parentTile: Tile3D, childId: string, frameState: FrameState): Promise<any>
  onTileLoaded?(tileset: Tileset3D, tile: Tile3D, loadResult: TileContentLoadResult): void
  getTilesTotalCount?(): number | null
}
```

## Concrete Sources

- [`Tiles3DSource`](/docs/modules/tiles/api-reference/tiles-3d-source) for 3D Tiles datasets
- [`I3SSource`](/docs/modules/tiles/api-reference/i3s-source) for I3S datasets

## Usage

```ts
import {Tileset3D} from '@loaders.gl/tiles'

const tileset = new Tileset3D(source, {
  onTileLoad: tile => console.log(tile.id)
})

await tileset.tilesetInitializationPromise
```
