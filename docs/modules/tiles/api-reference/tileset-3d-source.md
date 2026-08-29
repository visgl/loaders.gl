---
title: Tileset3DSource
description: The source contract between a 3D format and the shared tileset runtime.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiles module · source contract"
  title="Tileset3DSource"
  description="A format-neutral contract for connecting 3D Tiles, I3S, and other hierarchical datasets to Tileset3D traversal, culling, request scheduling, and cache management."
  tone="cyan"
  meta={['Format-neutral', '3D hierarchy', 'Source lifecycle']}
  links={[
    {label: 'Tileset3D', to: '/docs/modules/tiles/api-reference/tileset-3d'},
    {label: '3D Tiles source', to: '/docs/modules/tiles/api-reference/tiles-3d-source'},
    {label: 'I3S source', to: '/docs/modules/tiles/api-reference/i3s-source'}
  ]}
/>

<DocOrientation
  eyebrow="The contract boundary"
  title="Let each format own its rules. Share the runtime."
  description="A source normalizes metadata, creates runtime tile headers, resolves content, and supplies traversal hooks. Tileset3D can then manage the common lifecycle without knowing the source format."
  tone="cyan"
  items={[
    {label: 'Initialize', value: 'Load and normalize root metadata'},
    {label: 'Headers', value: 'Create runtime tile tree nodes'},
    {label: 'Content', value: 'Fetch and process selected payloads'},
    {label: 'Runtime', value: 'Traversal, culling, cache, and scheduling'}
  ]}
/>

<ReferenceBoundary
  title="Tileset3DSource reference"
  description="The sections below document responsibilities, lifecycle order, core shape, and concrete source implementations."
  tone="cyan"
/>

The `Tileset3DSource` interface defines the format-specific contract consumed by [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d).

`Tileset3D` owns traversal, culling, request scheduling, cache management, and selected-tile state. A `Tileset3DSource` owns the format-specific work required to make those runtime systems operate on a concrete dataset.

## Responsibilities

A `Tileset3DSource` implementation is responsible for:

- loading and normalizing root metadata
- creating runtime tile headers
- resolving tile content URLs
- loading tile content
- optionally loading a view-eligible lazy child-header group
- deriving format-specific view state metadata
- performing format-specific bookkeeping after tile content loads

## Lifecycle

`Tileset3D` uses the source in this order:

1. `initialize()` loads and normalizes root metadata
2. `getRootTileset()` returns the normalized root payload
3. `initializeTileHeaders()` creates the runtime tile tree
4. `createTraverser()` provides the traversal implementation
5. `loadTileChildren()` optionally expands source-managed lazy hierarchy metadata after traversal eligibility
6. `loadTileContent()` fetches content for selected tiles
7. `onTileLoaded()` optionally updates format-specific state
8. `destroy()` optionally releases source-local caches and guards late asynchronous work

## Core Shape

```ts
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
