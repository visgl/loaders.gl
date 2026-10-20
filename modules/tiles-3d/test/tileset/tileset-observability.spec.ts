import {describe, expect, test} from 'vitest';

import {getTileset3DTraversalSnapshot} from '../../src';

function createTile(id: string, renderable = false): any {
  return {
    id,
    contentAvailable: renderable,
    content: renderable ? {} : null
  };
}

function createTileset(overrides: Record<string, unknown> = {}): any {
  const values: Record<string, number> = {
    'Tiles Loading': 1,
    'Tiles Loaded': 4,
    'Failed Tile Loads': 2,
    'Tiles In Memory': 3
  };
  return {
    frameNumber: 7,
    selectedTiles: [createTile('tile-b', true), createTile('tile-a')],
    requestedTiles: [createTile('tile-c'), createTile('tile-a')],
    emptyTiles: [createTile('empty-b'), createTile('empty-a')],
    stats: {get: (name: string) => ({count: values[name] ?? 0})},
    gpuMemoryUsageInBytes: 4096,
    memoryAdjustedScreenSpaceError: 8,
    source: {},
    ...overrides
  };
}

describe('getTileset3DTraversalSnapshot', () => {
  test('sorts IDs and captures runtime counters', () => {
    const snapshot = getTileset3DTraversalSnapshot(createTileset());

    expect(snapshot).toEqual({
      frameNumber: 7,
      selectedTileIds: ['tile-a', 'tile-b'],
      requestedTileIds: ['tile-a', 'tile-c'],
      emptyTileIds: ['empty-a', 'empty-b'],
      visibleTileCount: 2,
      renderableTileCount: 1,
      loadingTileCount: 1,
      loadedTileCount: 4,
      failedTileCount: 2,
      cachedTileCount: 3,
      cacheBytes: 4096,
      maximumScreenSpaceError: 8
    });
  });

  test('copies IDs and includes implicit subtree diagnostics when available', () => {
    const tileset = createTileset({
      source: {
        getImplicitTilingStats: () => ({
          requestedSubtrees: 2,
          loadedSubtrees: 1,
          cacheHits: 3,
          cachedSubtrees: 1,
          pendingSubtrees: 0,
          materializedTiles: 8
        })
      }
    });

    const snapshot = getTileset3DTraversalSnapshot(tileset);
    tileset.selectedTiles[0].id = 'mutated';

    expect(snapshot.selectedTileIds).toEqual(['tile-a', 'tile-b']);
    expect(snapshot.implicitTiling?.cacheHits).toBe(3);
  });
});
