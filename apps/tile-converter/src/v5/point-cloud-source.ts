// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  PointCloudTileContent,
  PointCloudTileHeader,
  PointCloudTilesetSource
} from '@loaders.gl/tiles';

/** A source tile and its decoded point content, including null content when no payload exists. */
export type PointCloudSourceTile = {
  /** Header with the source tile's hierarchy, bounds, and LOD metadata. */
  readonly header: PointCloudTileHeader;
  /** Arrow point data and its coordinate metadata, or null for an empty tile. */
  readonly content: PointCloudTileContent | null;
};

/** Options for camera-independent point-cloud source traversal. */
export type TraversePointCloudSourceOptions = {
  /** Stop descending after this source tile level. Defaults to the complete hierarchy. */
  readonly maxDepth?: number;
  /** Cancel traversal between source operations. */
  readonly signal?: AbortSignal;
};

/**
 * Reads a point-cloud source in deterministic depth-first order, independent of a render camera.
 * Each yielded value retains its tile header and Arrow content metadata so callers can apply the
 * source coordinate frame and placement when encoding output tiles.
 *
 * @param source - An I3S, COPC, or compatible point-cloud tileset source.
 * @param options - Optional depth limit and cancellation signal.
 * @returns One header and decoded payload for each reachable source tile.
 */
export async function* traversePointCloudSource(
  source: PointCloudTilesetSource,
  options: TraversePointCloudSourceOptions = {}
): AsyncIterableIterator<PointCloudSourceTile> {
  const {maxDepth = Number.POSITIVE_INFINITY, signal} = options;
  if (maxDepth !== Number.POSITIVE_INFINITY && (!Number.isSafeInteger(maxDepth) || maxDepth < 0)) {
    throw new RangeError('Point-cloud source maxDepth must be a non-negative integer');
  }

  throwIfAborted(signal);
  if (!source.isReady) {
    await source.initialize();
  }
  throwIfAborted(signal);

  const root = await source.getRootTile();
  const pendingTiles = [root];
  const visitedTileIds = new Set<string>();

  while (pendingTiles.length > 0) {
    throwIfAborted(signal);
    const header = pendingTiles.pop()!;
    if (visitedTileIds.has(header.id)) {
      continue;
    }
    visitedTileIds.add(header.id);

    const content = await source.loadTileContent(header);
    throwIfAborted(signal);
    yield {header, content};
    throwIfAborted(signal);

    if (header.level >= maxDepth) {
      continue;
    }
    const children = await source.getChildren(header);
    throwIfAborted(signal);
    for (let index = children.length - 1; index >= 0; index--) {
      pendingTiles.push(children[index]);
    }
  }
}

/** Throws the signal reason when traversal has been cancelled. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw signal.reason ?? new DOMException('The operation was aborted', 'AbortError');
  }
}
