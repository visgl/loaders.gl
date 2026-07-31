// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import test from 'tape-promise/tape';
import type {Subtree} from '../../../src/types';
import type {ImplicitOptions} from '../../../src/lib/parsers/parse-3d-tile-header';
import {parseImplicitTiles} from '../../../src/lib/parsers/helpers/parse-3d-implicit-tiles';
import {LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '@loaders.gl/tiles';

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

  t.equal(tile.contentUrl, 'https://example.com/content/0/0/0.b3dm');
  t.equal(tile.children.length, 0);
  t.equal(tile.lodMetricValue, 500);
  t.end();
});
