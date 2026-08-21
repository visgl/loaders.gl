// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import test from 'test/utils/vitest-tape';
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
import {LOD_METRIC_TYPE, TILE_REFINEMENT} from '@loaders.gl/tiles';

test('parseImplicitTiles#supports a single available level', async t => {
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

  t.equal(tile.contentUrl, 'https://example.com/content/0/0/0.b3dm');
  t.equal(tile.children.length, 0);
  t.equal(tile.lodMetricValue, 500);
  t.end();
});

test('parseImplicitTiles#supports subtrees without content availability', async t => {
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

  t.equal(tile.contentUrl, undefined, 'omits a render URL when content availability is absent');
  t.equal(tile.children.length, 0);
  t.end();
});

test('normalizeImplicitTileHeaders#creates a contentless lazy root and validates its descriptor', async t => {
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

  t.equal(normalizedTile?.contentUrl, undefined);
  t.equal(normalizedTile?.implicitSubtree.descriptor.maximumLevel, 0);
  t.equal(
    normalizedTile?.implicitSubtree.subtreeUrl,
    'https://example.com/tiles/subtrees/0/0/0.subtree'
  );
  await t.rejects(
    normalizeImplicitTileHeaders(
      tile as any,
      {root: tile} as any,
      'https://example.com/tiles',
      {...tile.implicitTiling, availableLevels: 0} as any,
      {}
    ),
    /availableLevels to include at least the root level/
  );
  await t.rejects(
    normalizeImplicitTileHeaders(
      tile as any,
      {root: tile} as any,
      'https://example.com/tiles',
      {...tile.implicitTiling, subdivisionScheme: 'TRIANGLE'} as any,
      {}
    ),
    /Unsupported implicit subdivision scheme/
  );
  t.end();
});

test('implicit parser compatibility helpers materialize one subtree and replace URL coordinates', async t => {
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

  t.equal(tile?.contentUrl, 'https://example.com/content/0/0/0.b3dm');
  t.equal(replaceContentUrlTemplate('/{LEVEL}/{X}/{y}/{z}', 1, 2, 3, 4), '/1/2/3/4');
  t.end();
});
