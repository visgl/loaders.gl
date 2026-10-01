// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {coreApi, load} from '@loaders.gl/core';
import {WebMercatorViewport} from '@deck.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {getI3sTileHeader} from '@loaders.gl/i3s/test/test-utils/load-utils';
import {I3SSource, Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';
import {TILE_CONTENT_STATE, TILE_REFINEMENT} from '../../src/constants';
import type {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import {Tileset3DTraverser} from '../../src/tileset-3d/format-3d-tiles/tileset-3d-traverser';

const TILESET_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/Tilesets/Tileset/tileset.json';

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
    _inRequestVolume: true,
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

test.each([
  undefined,
  true,
  false
])('Tileset3D#3D Tiles defaults skip intermediate requests with override %s', async skipLevelOfDetail => {
  const tileset = new Tileset3D(
    new Tiles3DSource({url: TILESET_URL, loader: Tiles3DLoader, coreApi}),
    {skipLevelOfDetail}
  );
  await tileset.tilesetInitializationPromise;
  try {
    const {root, intermediate, leaf} = createReplacementTree(true);
    const traverser = traverseReplacementTree(root, tileset.options);
    const shouldSkip = skipLevelOfDetail !== false;

    expect(tileset.options.skipLevelOfDetail).toBe(shouldSkip);
    expect(Boolean(traverser.requestedTiles[intermediate.id])).toBe(!shouldSkip);
    expect(Boolean(traverser.requestedTiles[leaf.id])).toBe(true);
    expect(Object.keys(traverser.selectedTiles)).toContain('root');
  } finally {
    tileset.destroy();
  }
});

test('Tileset3D#I3S keeps skip LOD disabled by default', async () => {
  const header = await getI3sTileHeader();
  const tileset = new Tileset3D(new I3SSource({...header, coreApi}));
  await tileset.tilesetInitializationPromise;
  try {
    expect(tileset.options.skipLevelOfDetail).toBe(false);
  } finally {
    tileset.destroy();
  }
});

test('Tileset3D#default skip traversal supports independent views and a live opt-out', async () => {
  const header = await load(TILESET_URL, Tiles3DLoader);
  // Reuse the fixture bounds; only topology and geometric errors need controlled values.
  const createHeader = (id: string, geometricError: number, children: any[] = []) => ({
    ...header.root,
    id,
    refine: TILE_REFINEMENT.REPLACE,
    geometricError,
    lodMetricValue: geometricError,
    children
  });
  header.root = createHeader('root', 70, [
    createHeader('intermediate', 35, [createHeader('leaf', 0)])
  ]);
  const tileset = new Tileset3D(new Tiles3DSource({...header, coreApi}), {
    dynamicScreenSpaceError: false,
    foveatedScreenSpaceError: false,
    progressiveResolutionHeightFraction: 0
  });
  // Keep real selection/culling and runtime aggregation, but control content availability.
  vi.spyOn(tileset, '_loadTiles').mockImplementation(() => {});
  const camera = {longitude: -75.6121, latitude: 40.0425, width: 800, height: 600, pitch: 45};
  const far = new WebMercatorViewport({...camera, id: 'far', zoom: 10});
  const near = new WebMercatorViewport({...camera, id: 'near', zoom: 16});
  await tileset.tilesetInitializationPromise;
  try {
    await tileset.selectTiles([far, near]);
    const farRoot = tileset.roots.far;
    const nearRoot = tileset.roots.near;
    const nearIntermediate = nearRoot.children[0];
    const nearLeaf = nearIntermediate.children[0];
    farRoot.contentState = nearRoot.contentState = TILE_CONTENT_STATE.READY;

    await tileset.selectTiles([far, near]);
    expect(tileset.selectedTiles).toEqual(expect.arrayContaining([farRoot, nearRoot]));
    expect(tileset.requestedTiles).toContain(nearLeaf);
    expect(tileset.requestedTiles).not.toContain(nearIntermediate);

    tileset.setProps({skipLevelOfDetail: false});
    await tileset.selectTiles([far, near]);
    expect(tileset.requestedTiles).toContain(nearIntermediate);
    expect(tileset.selectedTiles).toContain(nearRoot);

    tileset.setProps({skipLevelOfDetail: true});
    nearLeaf.contentState = TILE_CONTENT_STATE.READY;
    await tileset.selectTiles([far, near]);
    expect(tileset.selectedTiles).toEqual(expect.arrayContaining([farRoot, nearLeaf]));
    expect(tileset.selectedTiles).not.toContain(nearRoot);

    await tileset.selectTiles(near);
    expect(tileset.selectedTiles).toEqual([nearLeaf]);
  } finally {
    tileset.destroy();
  }
});

test('Tileset3DTraverser#cold skip traversal requests coarse coverage before final detail', () => {
  const {root, intermediate, threshold, leaf} = createReplacementTree();
  const traverser = traverseReplacementTree(root, {});

  expect(Object.keys(traverser.requestedTiles)).toEqual(['root', 'threshold', 'leaf']);
  expect(Object.keys(traverser.selectedTiles)).toEqual([]);
  root.contentAvailable = true;
  root.hasUnloadedContent = false;
  root.contentUnloaded = false;
  traverser.traverse(root, {frameNumber: 2, viewport: {id: 'test'}} as any, {});

  expect(Object.keys(traverser.selectedTiles)).toEqual(['root']);
  expect(traverser.requestedTiles[intermediate.id]).toBeUndefined();
  expect(traverser.requestedTiles[threshold.id]).toBeDefined();
  expect(traverser.requestedTiles[leaf.id]).toBeDefined();
});

test('Tileset3DTraverser#skip LOD preserves fallback for a failed visible sibling', () => {
  const {root, threshold, leaf} = createReplacementTree(true);
  const sibling = createTraversalTile(root.tileset as unknown as TestTileset, 'sibling', 3, 0);
  appendChild(threshold, sibling);
  sibling.contentFailed = true;
  sibling.hasUnloadedContent = false;
  sibling.contentUnloaded = false;
  leaf.contentAvailable = true;
  leaf.hasUnloadedContent = false;
  leaf.contentUnloaded = false;

  const traverser = traverseReplacementTree(root, {});
  expect(Object.keys(traverser.selectedTiles).sort()).toEqual(['leaf', 'root']);
  expect(traverser.requestedTiles[sibling.id]).toBeUndefined();

  sibling.isVisibleAndInRequestVolume = false;
  traverser.traverse(root, {frameNumber: 2, viewport: {id: 'test'}} as any, {});
  expect(Object.keys(traverser.selectedTiles)).toEqual(['leaf']);
});

test('Tileset3DTraverser#known empty leaves do not hold replacement ancestors', () => {
  const {root, threshold, leaf} = createReplacementTree(true);
  const empty = createTraversalTile(root.tileset as unknown as TestTileset, 'empty', 3, 0);
  Object.assign(empty, {hasRenderContent: false, hasEmptyContent: true, hasUnloadedContent: false});
  appendChild(threshold, empty);
  Object.assign(leaf, {contentAvailable: true, hasUnloadedContent: false, contentUnloaded: false});

  const traverser = traverseReplacementTree(root, {});
  expect(Object.keys(traverser.selectedTiles)).toEqual(['leaf']);
  expect(traverser.requestedTiles[empty.id]).toBeUndefined();
});

test('Tileset3DTraverser#unresolved empty branches retain coverage until materialized', () => {
  const {root, intermediate} = createReplacementTree(true);
  intermediate.children = [];
  Object.assign(intermediate, {
    hasRenderContent: false,
    hasEmptyContent: true,
    hasUnloadedContent: false,
    hasUnloadedChildren: true
  });
  Object.defineProperty(intermediate, 'hasChildren', {
    get: () => intermediate.hasUnloadedChildren || intermediate.children.length > 0
  });
  const traverser = new Tileset3DTraverser({skipLevelOfDetail: true, onTraversalEnd: vi.fn()});
  traverser.updateTile = () => {};
  // Isolate the pending-header boundary; actual subtree loading is covered by implicit-tiling tests.
  traverser.updateChildTiles = () => {};
  traverser.traverse(root, {frameNumber: 1, viewport: {id: 'test'}} as any, {});
  expect(Object.keys(traverser.selectedTiles)).toEqual(['root']);

  Object.assign(intermediate, {hasUnloadedChildren: false});
  traverser.traverse(root, {frameNumber: 2, viewport: {id: 'test'}} as any, {});
  expect(Object.keys(traverser.selectedTiles)).toEqual([]);
});

test.each([
  false,
  true
])('Tileset3DTraverser#skip sibling loading honors viewer request volume %s', inRequestVolume => {
  const {root, intermediate} = createReplacementTree(true);
  Object.assign(intermediate, {
    isVisibleAndInRequestVolume: false,
    _inRequestVolume: inRequestVolume
  });
  const traverser = traverseReplacementTree(root, {loadSiblings: true});
  expect(Boolean(traverser.requestedTiles[intermediate.id])).toBe(inRequestVolume);
  expect(Object.keys(traverser.selectedTiles)).toEqual(['root']);
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
