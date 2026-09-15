// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import type {Subtree} from '../../../src/types';
import type {ImplicitOptions} from '../../../src/lib/parsers/parse-3d-tile-header';
import {
  normalizeImplicitTileHeaders,
  normalizeImplicitTileData
} from '../../../src/lib/parsers/parse-3d-tile-header';
import {
  parseImplicitTiles,
  replaceContentUrlTemplate
} from '../../../src/lib/parsers/helpers/parse-3d-implicit-tiles';
import {LOD_METRIC_TYPE, materializeImplicitSubtree, TILE_REFINEMENT} from '@loaders.gl/tiles';
test('parseImplicitTiles#supports a single available level', async () => {
  const subtree: Subtree = {
    buffers: [],
    bufferViews: [],
    tileAvailability: {constant: 1},
    contentAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0}
  };
  const implicitOptions: ImplicitOptions = {
    contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
    subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}.subtree',
    subdivisionScheme: 'QUADTREE',
    subtreeLevels: 1,
    maximumLevel: 0,
    refine: TILE_REFINEMENT.REPLACE,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: 500,
    rootBoundingVolume: {region: [0, 0, 1, 1, 0, 100]}
  };
  const tile = await parseImplicitTiles({
    subtree,
    implicitOptions,
    loaderOptions: {}
  });
  expect(tile.contentUrl).toBe('https://example.com/content/0/0/0.b3dm');
  expect(tile.children.length).toBe(0);
  expect(tile.lodMetricValue).toBe(500);
});
test('parseImplicitTiles#supports subtrees without content availability', async () => {
  const subtree: Subtree = {
    buffers: [],
    bufferViews: [],
    tileAvailability: {constant: 1},
    childSubtreeAvailability: {constant: 0}
  };
  const implicitOptions: ImplicitOptions = {
    contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
    subtreesUriTemplate: 'subtrees/{level}/{x}/{y}.subtree',
    subdivisionScheme: 'QUADTREE',
    subtreeLevels: 1,
    maximumLevel: 0,
    refine: 'REPLACE',
    basePath: 'https://example.com',
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: 500,
    rootBoundingVolume: {region: [0, 0, 1, 1, 0, 100]},
    getTileType: () => TILE_TYPE.SCENEGRAPH,
    getRefine: () => TILE_REFINEMENT.REPLACE
  };
  const tile = await parseImplicitTiles({
    subtree,
    implicitOptions,
    loaderOptions: {}
  });
  expect(tile.contentUrl, 'omits a render URL when content availability is absent').toBe(undefined);
  expect(tile.children.length).toBe(0);
});
test('normalizeImplicitTileHeaders#creates a contentless lazy root and validates its descriptor', async () => {
  const tile = {
    geometricError: 16,
    refine: 'REPLACE',
    boundingVolume: {region: [0, 0, 1, 1, 0, 10]},
    implicitTiling: {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 1,
      availableLevels: 1,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };
  const normalizedTile = await normalizeImplicitTileHeaders(
    tile as any,
    {root: tile} as any,
    'https://example.com/tiles',
    tile.implicitTiling as any,
    {}
  );
  expect(normalizedTile?.contentUrl).toBe(undefined);
  expect(normalizedTile?.implicitSubtree.descriptor.maximumLevel).toBe(0);
  expect(normalizedTile?.implicitSubtree.subtreeUrl).toBe(
    'https://example.com/tiles/subtrees/0/0/0.subtree'
  );
  await await expect(
    normalizeImplicitTileHeaders(
      tile as any,
      {root: tile} as any,
      'https://example.com/tiles',
      {...tile.implicitTiling, availableLevels: 0} as any,
      {}
    )
  ).rejects.toThrow(/availableLevels to include at least the root level/);
  await await expect(
    normalizeImplicitTileHeaders(
      tile as any,
      {root: tile} as any,
      'https://example.com/tiles',
      {...tile.implicitTiling, subdivisionScheme: 'TRIANGLE'} as any,
      {}
    )
  ).rejects.toThrow(/Unsupported implicit subdivision scheme/);
});
test('normalizeImplicitTileHeaders#preserves standard multiple-content templates', async () => {
  const tile = {
    geometricError: 16,
    refine: 'REPLACE',
    boundingVolume: {region: [0, 0, 1, 1, 0, 10]},
    contents: [
      {
        uri: 'vector/{level}/{x}/{y}.glb',
        extensions: {'3DTILES_content_gltf_vector': {vector: true, clip: true}}
      },
      {uri: 'metadata/{level}/{x}/{y}.json'}
    ],
    implicitTiling: {
      subdivisionScheme: 'QUADTREE',
      subtreeLevels: 1,
      availableLevels: 1,
      subtrees: {uri: 'subtrees/{level}/{x}/{y}.subtree'}
    }
  };

  const normalizedTile = await normalizeImplicitTileHeaders(
    tile as any,
    {root: tile} as any,
    'https://example.com/tiles',
    tile.implicitTiling as any,
    {}
  );

  expect(normalizedTile?.implicitSubtree.descriptor.contentUrlTemplates).toEqual([
    'https://example.com/tiles/vector/{level}/{x}/{y}.glb',
    'https://example.com/tiles/metadata/{level}/{x}/{y}.json'
  ]);
  expect(normalizedTile?.implicitSubtree.descriptor.contentHeaders?.[0]).toMatchObject({
    extensions: {'3DTILES_content_gltf_vector': {vector: true, clip: true}}
  });
  expect(normalizedTile?.content).toBeUndefined();

  const materializedRoot = materializeImplicitSubtree(
    {
      tileAvailability: {constant: 1},
      contentAvailability: [{constant: 1}, {constant: 1}],
      childSubtreeAvailability: {constant: 0}
    },
    normalizedTile!.implicitSubtree
  ).root;
  const mergedHeader = {...normalizedTile, ...materializedRoot};
  expect(mergedHeader.contents?.map(content => content.uri)).toEqual([
    'https://example.com/tiles/vector/0/0/0.glb',
    'https://example.com/tiles/metadata/0/0/0.json'
  ]);
});
test('implicit parser compatibility helpers materialize one subtree and replace URL coordinates', async () => {
  const implicitOptions: ImplicitOptions = {
    contentUrlTemplate: 'https://example.com/content/{level}/{x}/{y}.b3dm',
    subtreesUrlTemplate: 'https://example.com/subtrees/{level}/{x}/{y}.subtree',
    subdivisionScheme: 'QUADTREE',
    subtreeLevels: 1,
    maximumLevel: 0,
    refine: TILE_REFINEMENT.REPLACE,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: 16,
    rootBoundingVolume: {region: [0, 0, 1, 1, 0, 10]}
  };
  const tile = await normalizeImplicitTileData(
    {geometricError: 16, boundingVolume: implicitOptions.rootBoundingVolume} as any,
    '',
    {
      buffers: [],
      bufferViews: [],
      tileAvailability: {constant: 1},
      contentAvailability: {constant: 1},
      childSubtreeAvailability: {constant: 0}
    },
    implicitOptions,
    {}
  );
  expect(tile?.contentUrl).toBe('https://example.com/content/0/0/0.b3dm');
  expect(replaceContentUrlTemplate('/{LEVEL}/{X}/{y}/{z}', 1, 2, 3, 4)).toBe('/1/2/3/4');
});
