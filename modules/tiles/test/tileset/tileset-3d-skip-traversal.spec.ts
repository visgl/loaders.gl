// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {TILE_REFINEMENT} from '../../src/constants';
import type {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import {Tileset3DTraverser} from '../../src/tileset-3d/format-3d-tiles/tileset-3d-traverser';

type TestTileset = {
  memoryAdjustedScreenSpaceError: number;
  _cache: {touch: ReturnType<typeof vi.fn>};
};

/** Creates the minimal runtime tile shape needed by the traversal algorithm. */
function createTraversalTile(
  tileset: TestTileset,
  id: string,
  depth: number,
  screenSpaceError: number,
  contentAvailable = false
): Tile3D {
  const tile = {
    id,
    depth,
    parent: null,
    children: [],
    header: {},
    tileset,
    refine: TILE_REFINEMENT.REPLACE,
    hasRenderContent: true,
    hasEmptyContent: false,
    hasTilesetContent: false,
    contentAvailable,
    hasUnloadedContent: !contentAvailable,
    contentUnloaded: !contentAvailable,
    contentExpired: false,
    contentFailed: false,
    isVisible: true,
    isVisibleAndInRequestVolume: true,
    priorityDeferred: false,
    _distanceToCamera: depth,
    _screenSpaceError: screenSpaceError,
    _screenSpaceErrorProgressiveResolution: 0,
    _priorityProgressiveResolution: false,
    _selectionDepth: 0,
    _shouldRefine: false,
    _requestedFrame: 0,
    _priority: 0,
    get hasChildren() {
      return this.children.length > 0;
    },
    _getPriority: () => 0,
    contentVisibility: () => 'inside'
  };
  return tile as unknown as Tile3D;
}

/** Links a child into a synthetic traversal tree. */
function appendChild(parent: Tile3D, child: Tile3D): void {
  child.parent = parent;
  parent.children.push(child);
}

/** Creates a four-level replacement tree with decreasing screen-space error. */
function createReplacementTree(rootContentAvailable = false): {
  root: Tile3D;
  intermediate: Tile3D;
  threshold: Tile3D;
  leaf: Tile3D;
} {
  const tileset: TestTileset = {
    memoryAdjustedScreenSpaceError: 8,
    _cache: {touch: vi.fn()}
  };
  const root = createTraversalTile(tileset, 'root', 0, 2048, rootContentAvailable);
  const intermediate = createTraversalTile(tileset, 'intermediate', 1, 512);
  const threshold = createTraversalTile(tileset, 'threshold', 2, 64);
  const leaf = createTraversalTile(tileset, 'leaf', 3, 0);
  appendChild(root, intermediate);
  appendChild(intermediate, threshold);
  appendChild(threshold, leaf);
  return {root, intermediate, threshold, leaf};
}

/** Runs the dedicated skip traversal without requiring camera or bounding-volume fixtures. */
function traverseReplacementTree(
  root: Tile3D,
  options: ConstructorParameters<typeof Tileset3DTraverser>[0]
): Tileset3DTraverser {
  const traverser = new Tileset3DTraverser({
    skipLevelOfDetail: true,
    baseScreenSpaceError: 1024,
    skipScreenSpaceErrorFactor: 16,
    skipLevels: 1,
    onTraversalEnd: vi.fn(),
    ...options
  });
  traverser.updateTile = () => {};
  traverser.traverse(root, {frameNumber: 1, viewport: {id: 'test'}} as any, {});
  return traverser;
}

test('Tileset3DTraverser#skip LOD omits intermediate content requests', () => {
  const {root, intermediate, threshold, leaf} = createReplacementTree();
  const traverser = traverseReplacementTree(root, {});

  expect(Object.keys(traverser.requestedTiles)).toEqual(['root', 'threshold', 'leaf']);
  expect(traverser.requestedTiles[intermediate.id]).toBeUndefined();
  expect(threshold._requestedFrame).toBe(1);
  expect(leaf._requestedFrame).toBe(1);
});

test('Tileset3DTraverser#immediatelyLoadDesiredLevelOfDetail requests only the final tile', () => {
  const {root, intermediate, threshold, leaf} = createReplacementTree();
  const traverser = traverseReplacementTree(root, {
    immediatelyLoadDesiredLevelOfDetail: true
  });

  expect(Object.keys(traverser.requestedTiles)).toEqual(['leaf']);
  expect(traverser.requestedTiles[root.id]).toBeUndefined();
  expect(traverser.requestedTiles[intermediate.id]).toBeUndefined();
  expect(traverser.requestedTiles[threshold.id]).toBeUndefined();
});

test('Tileset3DTraverser#skip LOD retains the nearest ready ancestor as coverage', () => {
  const {root, leaf} = createReplacementTree(true);
  const traverser = traverseReplacementTree(root, {
    immediatelyLoadDesiredLevelOfDetail: true
  });

  expect(Object.keys(traverser.requestedTiles)).toEqual(['leaf']);
  expect(Object.keys(traverser.selectedTiles)).toEqual(['root']);
  expect(root._selectedFrame).toBe(1);
});

test('Tileset3DTraverser#skip LOD continues past a culled loaded ancestor', () => {
  const {root, intermediate, leaf} = createReplacementTree(true);
  intermediate.contentAvailable = true;
  intermediate.hasUnloadedContent = false;
  intermediate.contentUnloaded = false;
  intermediate.contentVisibility = () => 'outside';

  const traverser = traverseReplacementTree(root, {
    immediatelyLoadDesiredLevelOfDetail: true
  });

  expect(Object.keys(traverser.requestedTiles)).toEqual(['leaf']);
  expect(Object.keys(traverser.selectedTiles)).toEqual(['root']);
});

test('Tileset3DTraverser#skip LOD ignores disabled progressive-resolution thresholds', () => {
  const {root, intermediate, threshold, leaf} = createReplacementTree();
  intermediate._screenSpaceErrorProgressiveResolution = 16;
  threshold._screenSpaceErrorProgressiveResolution = 4;
  threshold._priorityProgressiveResolution = false;

  const traverser = traverseReplacementTree(root, {
    skipScreenSpaceErrorFactor: 1000
  });

  expect(Object.keys(traverser.requestedTiles)).toEqual(['root', 'leaf']);
  expect(traverser.requestedTiles[threshold.id]).toBeUndefined();
});
