// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
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
test('implicit tiling materializes one sparse subtree and leaves lazy boundaries', () => {
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
  expect(result.tileCount, 'counts only available tiles in the current subtree').toBe(4);
  expect(result.childSubtreeCount, 'creates references only for available child subtrees').toBe(2);
  expect(result.root.children.length, 'preserves sparse tile availability').toBe(3);
  expect(result.root.contentUrl).toBe('https://example.com/content/0/0/0/0.b3dm');
  expect(result.root.children[0].contentUrl, 'supports contentless connector tiles').toBeFalsy();
  expect(result.root.children[0].children[0].implicitSubtree?.coordinates.level).toBe(2);
  expect(
    result.root.children[2].children[0].implicitSubtree?.coordinates,
    'uses child-subtree Morton indexes without a breadth-first tile offset'
  ).toEqual({level: 2, x: 3, y: 3, z: 0});
});
test('implicit tiling materializes multiple content streams in source order', () => {
  const descriptor = createDescriptor({
    contentUrlTemplates: [
      'https://example.com/geometry/{level}/{x}/{y}/{z}.b3dm',
      'https://example.com/metadata/{level}/{x}/{y}/{z}.json'
    ],
    contentHeaders: [{group: 'geometry'}, {group: 'metadata'}]
  });
  const result = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: [{constant: 1}, {constant: 1}],
      childSubtreeAvailability: {constant: 0}
    },
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );
  expect(result.root.contentUrl).toBe('https://example.com/geometry/0/0/0/0.b3dm');
  expect(result.root.contentUrls).toEqual([
    'https://example.com/geometry/0/0/0/0.b3dm',
    'https://example.com/metadata/0/0/0/0.json'
  ]);
  expect(result.root.content).toEqual([
    {group: 'geometry', uri: 'https://example.com/geometry/0/0/0/0.b3dm'},
    {group: 'metadata', uri: 'https://example.com/metadata/0/0/0/0.json'}
  ]);
});
test('implicit tiling preserves content-header indexes for sparse streams', () => {
  const descriptor = createDescriptor({
    contentUrlTemplates: [
      'https://example.com/a/{level}.b3dm',
      'https://example.com/b/{level}.json'
    ],
    contentHeaders: [{group: 'a'}, {group: 'b'}]
  });
  const result = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: [{constant: 0}, {constant: 1}],
      childSubtreeAvailability: {constant: 0}
    },
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );
  expect(result.root.contentUrl).toBe('https://example.com/b/0.json');
  expect(result.root.content).toEqual({group: 'b', uri: 'https://example.com/b/0.json'});
});
test('implicit tiling treats maximumLevel as the last zero-based available level', () => {
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
  expect(result.root.children.length, 'materializes the final available level').toBe(4);
  expect(result.root.children.every(child => child.children.length === 0)).toBeTruthy();
  expect(result.root.children.every(child => !child.implicitSubtree)).toBeTruthy();
  expect(result.childSubtreeCount, 'does not create references beyond the last level').toBe(0);
});
test('implicit octree boundary references preserve coordinates, error and region height', () => {
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
  expect(child.implicitSubtree?.coordinates).toEqual({level: 1, x: 1, y: 1, z: 1});
  expect(child.lodMetricValue, 'halves geometric error once per global level').toBe(32);
  expect(child.boundingVolume.region).toEqual([0.5, 0.5, 1, 1, 50, 100]);
});
test('implicit quadtree boxes subdivide horizontal half axes and retain height', () => {
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
  expect(
    child.boundingVolume.box,
    'uses oriented half-axis vectors rather than axis-aligned assumptions'
  ).toEqual([5, -10, 0, 5, 0, 0, 0, 10, 0, 0, 0, 30]);
});
test('implicit region subdivision preserves antimeridian-crossing longitude intervals', () => {
  const descriptor = createDescriptor({
    subtreeLevels: 1,
    maximumLevel: 1,
    rootBoundingVolume: {region: [3, -0.5, -3, 0.5, 0, 20]}
  });
  const child = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 0},
      childSubtreeAvailability: {explicitBitstream: new Uint8Array([0b00000001])}
    },
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  ).root.children[0];
  expect(child.boundingVolume.region).toEqual([3, -0.5, 0, 0, 0, 20]);
});
test('implicit octree materializes all eight child coordinates from one availability byte', () => {
  const descriptor = createDescriptor({
    subdivisionScheme: 'OCTREE',
    subtreeLevels: 1,
    maximumLevel: 1
  });
  const result = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 0},
      childSubtreeAvailability: {explicitBitstream: new Uint8Array([0xff])}
    },
    createImplicitSubtreeReference(descriptor, {level: 0, x: 4, y: 2, z: 1})
  );
  expect(result.root.children.length).toBe(8);
  expect(result.root.children.map(child => child.implicitSubtree?.coordinates)).toEqual([
    {level: 1, x: 8, y: 4, z: 2},
    {level: 1, x: 9, y: 4, z: 2},
    {level: 1, x: 8, y: 5, z: 2},
    {level: 1, x: 9, y: 5, z: 2},
    {level: 1, x: 8, y: 4, z: 3},
    {level: 1, x: 9, y: 4, z: 3},
    {level: 1, x: 8, y: 5, z: 3},
    {level: 1, x: 9, y: 5, z: 3}
  ]);
});
test('implicit URL templates replace coordinates case-insensitively', () => {
  expect(replaceImplicitUrlTemplate('/{LEVEL}/{X}/{y}/{z}', {level: 3, x: 4, y: 5, z: 6})).toBe(
    '/3/4/5/6'
  );
});
test('draft subtree attributes and property rows override computed implicit values', () => {
  const descriptor = createDescriptor({
    contentUrlTemplate: 'https://example.com/{level}/{tileId}/{timestamp}.glb',
    maximumLevel: 1,
    scaleGeometricError: false
  });
  const tileBoundingBoxes = new Float64Array(5 * 16);
  const tileTransforms = new Float64Array(5 * 16);
  const contentBoundingSpheres = new Float64Array(5 * 4);
  for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
    tileBoundingBoxes.set(
      [2, 0, 0, 0, 0, 4, 0, 0, 0, 0, 6, 0, 10 + rowIndex, 20, 30, 1],
      rowIndex * 16
    );
    tileTransforms.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, rowIndex, 0, 0, 1], rowIndex * 16);
    contentBoundingSpheres.set([rowIndex, 2, 3, 4], rowIndex * 4);
  }
  const result = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 1},
      childSubtreeAvailability: {constant: 0},
      tileAttributes: {
        TILE_BOUNDING_BOX: tileBoundingBoxes,
        TILE_GEOMETRIC_ERROR: new Float64Array([7, 6, 5, 4, 3]),
        TILE_REFINE: new Uint8Array([0, 1, 1, 1, 1]),
        TILE_TRANSFORM: tileTransforms
      },
      contentAttributes: {CONTENT_BOUNDING_SPHERE: contentBoundingSpheres},
      tilePropertyRows: Array.from({length: 5}, (_unused, rowIndex) => ({
        level: `tile-${rowIndex}`,
        tileId: `tile-${rowIndex}`,
        timestamp: 100 + rowIndex
      })),
      contentPropertyRows: Array.from({length: 5}, (_unused, rowIndex) => ({
        level: `content-${rowIndex}`,
        tileId: `content-${rowIndex}`
      }))
    },
    createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
  );

  expect(result.root.contentUrl).toBe('https://example.com/content-0/content-0/100.glb');
  expect(result.root.boundingVolume.box).toEqual([10, 20, 30, 1, 0, 0, 0, 2, 0, 0, 0, 3]);
  expect(result.root.content.boundingVolume.sphere).toEqual([0, 2, 3, 4]);
  expect(result.root.lodMetricValue).toBe(7);
  expect(result.root.refine).toBe(TILE_REFINEMENT.ADD);
  expect(result.root.transform[12]).toBe(0);
  expect(result.root.metadata.properties).toEqual({
    level: 'tile-0',
    tileId: 'tile-0',
    timestamp: 100
  });
  expect(result.root.implicitMetadata?.contentProperties).toEqual({
    level: 'content-0',
    tileId: 'content-0'
  });
  expect(result.root._scaleGeometricError).toBe(false);
});
test('implicit tiling rejects availability and attribute counts that cannot describe a subtree', () => {
  const descriptor = createDescriptor();
  expect(() =>
    materializeImplicitSubtree(
      {
        tileAvailability: {explicitBitstream: new Uint8Array(0)},
        contentAvailability: {constant: 0},
        childSubtreeAvailability: {constant: 0}
      },
      createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
    )
  ).toThrow(/tile availability bitstream is too short/);
  expect(() =>
    materializeImplicitSubtree(
      {
        tileAvailability: {constant: 1},
        contentAvailability: {constant: 0},
        childSubtreeAvailability: {constant: 0},
        tileAttributes: {TILE_GEOMETRIC_ERROR: new Float64Array([1])}
      },
      createImplicitSubtreeReference(descriptor, {level: 0, x: 0, y: 0, z: 0})
    )
  ).toThrow(/TILE_GEOMETRIC_ERROR count does not match availability/);
});
test('implicit subtree traversal requires visibility, request volume and SSE', async () => {
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
  expect(requestCount, 'does not request an invisible or out-of-volume subtree').toBe(0);
  tile.isVisibleAndInRequestVolume = true;
  traverser.shouldRefine = () => false;
  traverser.updateChildTiles(tile, frameState);
  expect(requestCount, 'does not request a subtree after the tile meets SSE').toBe(0);
  traverser.shouldRefine = () => true;
  traverser.updateChildTiles(tile, frameState);
  await Promise.resolve();
  expect(requestCount, 'requests one eligible subtree').toBe(1);
  expect(tile.children.length, 'retains the current traversal boundary while loading').toBe(0);
});
test('implicit subtree traversal preserves REPLACE coverage while availability is pending', () => {
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
  expect(
    traverser.executeEmptyTraversal(root, {} as any),
    'does not classify an unresolved lazy boundary as complete empty coverage'
  ).toBeFalsy();
  root.header.implicitSubtree = undefined;
  expect(
    traverser.executeEmptyTraversal(root, {} as any),
    'retains the established explicit empty-leaf behavior after materialization'
  ).toBeTruthy();
});
