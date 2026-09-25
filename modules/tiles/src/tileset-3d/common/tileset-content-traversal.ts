// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Tile3D} from './tile-3d';
import type {Tileset3D} from './tileset-3d';
import type {TileContentLoadResult} from './tileset-source';
import type {Tile3DContent} from './tile-3d-contracts';
import {TILESET_TYPE} from '../../constants';

/** Options for complete camera-independent tileset content traversal. */
export interface TraverseTilesetContentsOptions {
  /** Cancel traversal and stop issuing further source requests. */
  readonly signal?: AbortSignal;
}

/** One tile placement and its ordered content entries from a completed source read. */
export interface TilesetContentTraversalItem {
  /** Runtime tile placement. Shared content resources are yielded once per placement. */
  readonly tile: Tile3D;
  /** Ordered content entries, including multiple contents declared by a single tile. */
  readonly contents: readonly Tile3DContent[];
}

/**
 * Walks every declared tile placement and its loaded content without a camera or visibility test.
 *
 * Source implementations remain responsible for lazy subtree and node-page resolution. Children
 * are visited in declaration order, nested tilesets are installed by the source before descent,
 * and repeated resource URLs are not deduplicated because each placement can have a distinct
 * transform. Content stays attached to its tile until the caller unloads it or destroys the
 * tileset.
 *
 * @param tileset - Initialized or initializing source-backed tileset runtime.
 * @param options - Cancellation options for source-managed requests.
 * @returns One item for each visited tile placement in deterministic depth-first order.
 */
export async function* traverseTilesetContents(
  tileset: Tileset3D,
  options: TraverseTilesetContentsOptions = {}
): AsyncGenerator<TilesetContentTraversalItem> {
  await tileset.tilesetInitializationPromise;
  throwIfAborted(options.signal);
  if (!tileset.root) {
    throw new Error('Tileset initialization completed without a root tile');
  }

  const stack: Tile3D[] = [tileset.root];
  const visitedTiles = new Set<Tile3D>();
  while (stack.length > 0) {
    throwIfAborted(options.signal);
    const tile = stack.pop() as Tile3D;
    if (visitedTiles.has(tile)) {
      continue;
    }
    visitedTiles.add(tile);

    if (tile.header.implicitSubtree && tile.childrenState !== 'ready') {
      const loadChildren = tileset.source.loadTileChildrenForTraversal;
      if (!loadChildren) {
        throw new Error('Tileset source does not support camera-independent subtree loading');
      }
      const result = await loadChildren.call(tileset.source, tile, options.signal);
      if (!result.loaded) {
        throw new Error(`Unable to load implicit subtree for tile ${tile.id}`);
      }
      tile.childrenState = 'ready';
    }

    if (tileset.type === TILESET_TYPE.I3S && tileset.source.loadTileChildrenForTraversal) {
      const result = await tileset.source.loadTileChildrenForTraversal(tile, options.signal);
      if (!result.loaded) {
        throw new Error(`Unable to load I3S child nodes for tile ${tile.id}`);
      }
    }

    throwIfAborted(options.signal);
    let loadResult: TileContentLoadResult | null = null;
    if (tile.contentUrls.length > 0 && !tile.content) {
      loadResult = await tile.loadContent();
      throwIfAborted(options.signal);
      if (loadResult.loaded) {
        tileset.source.onTileLoaded?.(tileset, tile, loadResult);
      }
    }

    yield {tile, contents: tile.contentEntries};

    for (let childIndex = tile.children.length - 1; childIndex >= 0; childIndex--) {
      stack.push(tile.children[childIndex]);
    }
  }
}

/** Throws the signal reason when traversal is cancelled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
  }
}
