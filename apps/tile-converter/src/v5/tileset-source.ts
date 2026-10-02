// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {traverseTilesetContents} from '@loaders.gl/tiles';
import type {
  Tileset3D,
  TilesetContentTraversalItem,
  TilesetSourceMetadata
} from '@loaders.gl/tiles';
import {TileConversionError} from './conversion-api.js';
import type {TileConversionSource} from './conversion-api.js';

/**
 * Adapts a source-backed tileset to the portable v5 conversion source contract.
 *
 * Inspection waits for initialization and returns the source's normalized metadata. Reading uses
 * camera-independent shared traversal, retaining each placement and its ordered decoded contents.
 * Source adapters own content, subtree, node-page, nested tileset, and archive resolution.
 *
 * Loaded content remains attached to the runtime tiles. Applications own unloading and destroying
 * the tileset, as well as format codecs, byte accounting, and output packaging. This adapter does
 * not impose an aggregate input memory limit or transform coordinates.
 *
 * @param tileset - An initializing or initialized runtime backed by a 3D Tiles or I3S source.
 * @returns A source accepted by `inspectTileset` and `convertTileset`.
 */
export function createTilesetConversionSource(
  tileset: Tileset3D
): TileConversionSource<TilesetSourceMetadata, TilesetContentTraversalItem> {
  return {
    async inspect(signal) {
      signal?.throwIfAborted();
      await tileset.tilesetInitializationPromise;
      signal?.throwIfAborted();
      if (!tileset.root) {
        throw new TileConversionError(
          'TILESET_ROOT_REQUIRED',
          'Tileset initialization completed without a root tile'
        );
      }
      return tileset.source.getMetadata();
    },
    read: (_inspection, signal) => traverseTilesetContents(tileset, {signal})
  };
}
