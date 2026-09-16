// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Tileset3D} from './tileset-3d';
import type {Tile3D} from './tile-3d';

/**
 * A deterministic, renderer-neutral snapshot of one {@link Tileset3D} traversal.
 *
 * Tile IDs are sorted so snapshots can be compared across runs even when child requests complete
 * in a different order. Counts are reported for the completed traversal frame and cache values are
 * expressed in bytes. This is an inspection contract; it does not alter traversal or request policy.
 */
export type Tileset3DTraversalSnapshot = {
  /** Monotonically increasing traversal frame number. */
  frameNumber: number;
  /** IDs selected for rendering, sorted for stable comparisons. */
  selectedTileIds: string[];
  /** IDs whose content was requested, sorted for stable comparisons. */
  requestedTileIds: string[];
  /** IDs visited as hierarchy-only or empty tiles, sorted for stable comparisons. */
  emptyTileIds: string[];
  /** Number of selected tiles in the completed frame. */
  visibleTileCount: number;
  /** Number of selected tiles with renderable content. */
  renderableTileCount: number;
  /** Number of tile or subtree loads currently in flight. */
  loadingTileCount: number;
  /** Cumulative number of tiles loaded into the runtime cache. */
  loadedTileCount: number;
  /** Cumulative number of failed tile loads. */
  failedTileCount: number;
  /** Number of tiles currently retained in the runtime cache. */
  cachedTileCount: number;
  /** Estimated cached content bytes. */
  cacheBytes: number;
  /** Active memory-adjusted maximum SSE in logical/CSS pixels. */
  maximumScreenSpaceError: number;
  /** Source-specific implicit subtree counters, when the source exposes them. */
  implicitTiling?: {
    /** Number of subtree resources requested from the source. */
    requestedSubtrees: number;
    /** Number of subtree resources successfully materialized. */
    loadedSubtrees: number;
    /** Number of requests served by the parsed-subtree cache. */
    cacheHits: number;
    /** Number of parsed subtrees currently retained for reuse. */
    cachedSubtrees: number;
    /** Number of subtree requests currently in flight. */
    pendingSubtrees: number;
    /** Number of runtime tile headers created from materialized subtrees. */
    materializedTiles: number;
  };
};

/**
 * Creates a stable observability snapshot from public {@link Tileset3D} state.
 *
 * The helper intentionally reads only public runtime fields and source diagnostics. It is safe to
 * call from an instrumentation loop and does not retain tile or content references.
 *
 * @param tileset - Runtime whose most recent traversal should be inspected.
 * @returns A serializable snapshot suitable for logs, regression fixtures, and benchmark output.
 */
export function getTileset3DTraversalSnapshot(tileset: Tileset3D): Tileset3DTraversalSnapshot {
  const selectedTiles = tileset.selectedTiles.slice();
  const requestedTiles = tileset.requestedTiles.slice();
  const emptyTiles = tileset.emptyTiles.slice();

  const getTileIds = (tiles: readonly Tile3D[]): string[] =>
    tiles.map(tile => String(tile.id)).sort();

  const getStatCount = (name: string): number => {
    const count = tileset.stats.get(name).count;
    return typeof count === 'number' && Number.isFinite(count) ? count : 0;
  };

  const implicitTilingSource = tileset.source as Tileset3D['source'] & {
    getImplicitTilingStats?: () => Tileset3DTraversalSnapshot['implicitTiling'];
  };
  const implicitTiling = implicitTilingSource.getImplicitTilingStats?.();

  return {
    frameNumber: tileset.frameNumber,
    selectedTileIds: getTileIds(selectedTiles),
    requestedTileIds: getTileIds(requestedTiles),
    emptyTileIds: getTileIds(emptyTiles),
    visibleTileCount: selectedTiles.length,
    renderableTileCount: selectedTiles.filter(
      tile => tile.contentAvailable && Boolean(tile.content)
    ).length,
    loadingTileCount: getStatCount('Tiles Loading'),
    loadedTileCount: getStatCount('Tiles Loaded'),
    failedTileCount: getStatCount('Failed Tile Loads'),
    cachedTileCount: getStatCount('Tiles In Memory'),
    cacheBytes: tileset.gpuMemoryUsageInBytes,
    maximumScreenSpaceError: tileset.memoryAdjustedScreenSpaceError,
    ...(implicitTiling ? {implicitTiling} : {})
  };
}
