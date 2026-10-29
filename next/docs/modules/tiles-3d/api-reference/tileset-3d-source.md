Tiles module · source contract

# Tileset3DSource

A format-neutral contract for connecting 3D Tiles, I3S, and other hierarchical datasets to Tileset3D traversal, culling, request scheduling, and cache management.

[Tileset3D](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)[3D Tiles source](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md)[I3S source](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/i3s-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/i3s-source.md)

The contract boundary

## Let each format own its rules. Share the runtime.

A source normalizes metadata, creates runtime tile headers, resolves content, and supplies traversal hooks. Tileset3D can then manage the common lifecycle without knowing the source format.

01

Initialize

Load and normalize root metadata

02

Headers

Create runtime tile tree nodes

03

Content

Fetch and process selected payloads

04

Runtime

Traversal, culling, cache, and scheduling

Detailed guide

## Tileset3DSource reference

The sections below document responsibilities, lifecycle order, core shape, and concrete source implementations.

The `Tileset3DSource` interface defines the format-specific contract consumed by [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md).

`Tileset3D` owns traversal, culling, request scheduling, cache management, and selected-tile state. A `Tileset3DSource` owns the format-specific work required to make those runtime systems operate on a concrete dataset.

## Responsibilities[​](#responsibilities "Direct link to Responsibilities")

A `Tileset3DSource` implementation is responsible for:

* loading and normalizing root metadata
* creating runtime tile headers
* resolving tile content URLs
* loading tile content
* optionally loading a view-eligible lazy child-header group
* deriving format-specific view state metadata
* performing format-specific bookkeeping after tile content loads

## Lifecycle[​](#lifecycle "Direct link to Lifecycle")

`Tileset3D` uses the source in this order:

1. `initialize()` loads and normalizes root metadata
2. `getRootTileset()` returns the normalized root payload
3. `initializeTileHeaders()` creates the runtime tile tree
4. `createTraverser()` provides the traversal implementation
5. `loadTileChildren()` optionally expands source-managed lazy hierarchy metadata after traversal eligibility
6. `loadTileContent()` fetches content for selected tiles
7. `onTileLoaded()` optionally updates format-specific state
8. `destroy()` optionally releases source-local caches and guards late asynchronous work

## Core Shape[​](#core-shape "Direct link to Core Shape")

```
export interface Tileset3DSource {

  initialize(): Promise<void>

  destroy?(): void

  getMetadata(): TilesetSourceMetadata

  getRootTileset(): Promise<TilesetJSON>

  initializeTileHeaders(

    tileset: Tileset3D,

    tilesetJson: TilesetJSON,

    parentTile?: Tile3D | null

  ): Tile3D

  createTraverser(options: TilesetTraverserProps): TilesetTraverser

  loadTileChildren?(tile: Tile3D, frameState: FrameState): Promise<TileChildrenLoadResult>

  loadTileContent(tile: Tile3D): Promise<TileContentLoadResult>

  getTileUrl(tilePath: string): string

  getViewState(rootTile: Tile3D | null): TilesetSourceViewState

  loadChildTileHeader?(parentTile: Tile3D, childId: string, frameState: FrameState): Promise<any>

  onTileLoaded?(tileset: Tileset3D, tile: Tile3D, loadResult: TileContentLoadResult): void

  getTilesTotalCount?(): number | null

}
```

## Concrete Sources[​](#concrete-sources "Direct link to Concrete Sources")

* [`Tiles3DSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tiles-3d-source.md) for 3D Tiles datasets
* [`I3SSource`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/i3s-source.md) for I3S datasets

## Usage[​](#usage "Direct link to Usage")

```
import {Tileset3D} from '@loaders.gl/tiles-3d';



const tileset = new Tileset3D(source, {

  onTileLoad: tile => console.log(tile.id)

})



await tileset.tilesetInitializationPromise
```
