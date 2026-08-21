// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  createImplicitSubtreeReference,
  LOD_METRIC_TYPE,
  materializeImplicitSubtree,
  replaceImplicitUrlTemplate,
  TILE_REFINEMENT,
  type ImplicitTilingDescriptor,
  type ParsedImplicitSubtree
} from '@loaders.gl/tiles';
import {Tileset3DTraverser} from '../../src/tileset-3d/format-3d-tiles/tileset-3d-traverser';

/** Creates a compact descriptor that individual tests can override. */
function createDescriptor(
  overrides: Partial<ImplicitTilingDescriptor> = {}
): ImplicitTilingDescriptor {
  return {
    contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}/{z}.b3dm',
    subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}/{z}.subtree',
    subdivisionScheme: 'QUADTREE',
    subtreeLevels: 2,
    maximumLevel: 2,
    refine: TILE_REFINEMENT.REPLACE,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: 64,
    rootBoundingVolume: {region: [0, 0, 1, 1, 0, 100]},
    ...overrides
  };
}

test('implicit tiling materializes one sparse subtree and leaves lazy boundaries', t => {
  const descriptor = createDescriptor();
  const subtree: ParsedImplicitSubtree = {
    tileAvailability: {explicitBitstream: new Uint8Array([0b00010111])},
    contentAvailability: {explicitBitstream: new Uint8Array([0b00010101])},
    childSubtreeAvailability: {explicitBitstream: new Uint8Array([0b00000001, 0b10000000])}
  };

  const result = materializeImplicitSubtree(
    subtree,
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );

  t.equal(result.tileCount, 4, 'counts only available tiles in the current subtree');
  t.equal(result.childSubtreeCount, 2, 'creates references only for available child subtrees');
  t.equal(result.root.children.length, 3, 'preserves sparse tile availability');
  t.equal(result.root.contentUrl, 'https://example.com/content/0/0/0/0.b3dm');
  t.notOk(result.root.children[0].contentUrl, 'supports contentless connector tiles');
  t.equal(result.root.children[0].children[0].implicitSubtree?.coordinates.level, 2);
  t.deepEqual(
    result.root.children[2].children[0].implicitSubtree?.coordinates,
    {level: 2, x: 3, y: 3, z: 0},
    'uses child-subtree Morton indexes without a breadth-first tile offset'
  );
  t.end();
});

test('implicit tiling treats maximumLevel as the last zero-based available level', t => {
  const descriptor = createDescriptor({maximumLevel: 1});
  const subtree: ParsedImplicitSubtree = {
    tileAvailability: {constant: 1},
    contentAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 1}
  };

  const result = materializeImplicitSubtree(
    subtree,
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );

  t.equal(result.root.children.length, 4, 'materializes the final available level');
  t.ok(result.root.children.every(child => child.children.length === 0));
  t.ok(result.root.children.every(child => !child.implicitSubtree));
  t.equal(result.childSubtreeCount, 0, 'does not create references beyond the last level');
  t.end();
});

test('implicit octree boundary references preserve coordinates, error and region height', t => {
  const descriptor = createDescriptor({
    subdivisionScheme: 'OCTREE',
    subtreeLevels: 1,
    maximumLevel: 1
  });
  const subtree: ParsedImplicitSubtree = {
    tileAvailability: {constant: 1},
    contentAvailability: {constant: 0},
    childSubtreeAvailability: {explicitBitstream: new Uint8Array([0b10000000])}
  };

  const result = materializeImplicitSubtree(
    subtree,
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );
  const child = result.root.children[0];

  t.deepEqual(child.implicitSubtree?.coordinates, {level: 1, x: 1, y: 1, z: 1});
  t.equal(child.lodMetricValue, 32, 'halves geometric error once per global level');
  t.deepEqual(child.boundingVolume.region, [0.5, 0.5, 1, 1, 50, 100]);
  t.end();
});

test('implicit quadtree boxes subdivide horizontal half axes and retain height', t => {
  const descriptor = createDescriptor({
    subtreeLevels: 1,
    maximumLevel: 1,
    rootBoundingVolume: {box: [0, 0, 0, 10, 0, 0, 0, 20, 0, 0, 0, 30]}
  });
  const subtree: ParsedImplicitSubtree = {
    tileAvailability: {constant: 1},
    contentAvailability: {constant: 0},
    childSubtreeAvailability: {explicitBitstream: new Uint8Array([0b00000010])}
  };

  const child = materializeImplicitSubtree(
    subtree,
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  ).root.children[0];

  t.deepEqual(
    child.boundingVolume.box,
    [5, -10, 0, 5, 0, 0, 0, 10, 0, 0, 0, 30],
    'uses oriented half-axis vectors rather than axis-aligned assumptions'
  );
  t.end();
});

test('implicit URL templates replace coordinates case-insensitively', t => {
  t.equal(
    replaceImplicitUrlTemplate('/{LEVEL}/{X}/{y}/{z}', {level: 3, x: 4, y: 5, z: 6}),
    '/3/4/5/6'
  );
  t.end();
});

test('implicit subtree traversal requires visibility, request volume and SSE', async t => {
  let requestCount = 0;
  const tile = {
    id: 'implicit-root',
    hasUnloadedChildren: true,
    isVisibleAndInRequestVolume: false,
    children: [],
    tileset: {
      async _loadTileChildren() {
        requestCount++;
      }
    }
  } as any;
  const traverser = new Tileset3DTraverser({});
  traverser.shouldRefine = () => true;
  const frameState = {frameNumber: 1, viewport: {id: 'test'}} as any;

  traverser.updateChildTiles(tile, frameState);
  t.equal(requestCount, 0, 'does not request an invisible or out-of-volume subtree');

  tile.isVisibleAndInRequestVolume = true;
  traverser.shouldRefine = () => false;
  traverser.updateChildTiles(tile, frameState);
  t.equal(requestCount, 0, 'does not request a subtree after the tile meets SSE');

  traverser.shouldRefine = () => true;
  traverser.updateChildTiles(tile, frameState);
  await Promise.resolve();
  t.equal(requestCount, 1, 'requests one eligible subtree');
  t.equal(tile.children.length, 0, 'retains the current traversal boundary while loading');
  t.end();
});

test('implicit subtree traversal preserves REPLACE coverage while availability is pending', t => {
  const traverser = new Tileset3DTraverser({});
  traverser.canTraverse = () => true;
  traverser.updateTile = () => {};
  traverser.loadTile = () => {};
  traverser.touchTile = () => {};
  const root = {
    hasRenderContent: false,
    hasEmptyContent: true,
    contentAvailable: false,
    children: [],
    header: {implicitSubtree: {}},
    isVisibleAndInRequestVolume: true
  } as any;

  t.notOk(
    traverser.executeEmptyTraversal(root, {} as any),
    'does not classify an unresolved lazy boundary as complete empty coverage'
  );
  root.header.implicitSubtree = undefined;
  t.ok(
    traverser.executeEmptyTraversal(root, {} as any),
    'retains the established explicit empty-leaf behavior after materialization'
  );
  t.end();
});
