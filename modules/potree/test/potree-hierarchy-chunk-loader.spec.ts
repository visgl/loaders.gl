// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {fetchFile, parse} from '@loaders.gl/core';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import {PotreeHierarchyChunkLoader} from '@loaders.gl/potree';
import {PotreeNodesSource} from '../src/lib/potree-node-source';
import {buildPotreeHierarchyFromMetadata} from '../src/parsers/parse-potree-hierarchy-chunk';

const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';

test('PotreeHierarchyChunkLoader#parse', async t => {
  const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  const rootNode = await parse(response, PotreeHierarchyChunkLoader);
  t.equal(countTreeNodes(rootNode), 167);
  t.equal(rootNode.name, '', 'rootNode.name');
  t.equal(rootNode.pointCount, 3751, 'rootNode.pointCount');
  t.equal(rootNode.header.childCount, 6, 'rootNode.childCount');
  t.equal(rootNode.children.length, 6, 'rootNode.children');
  t.equal(rootNode.childrenByIndex.length, 8, 'rootNode.childrenByIndex');
  t.end();
});

test('buildPotreeHierarchyFromMetadata', t => {
  const rootNode = buildPotreeHierarchyFromMetadata(
    [
      ['r', 10],
      ['r0', 4],
      ['r3', 6],
      ['r04', 2],
      ['r36', 1]
    ],
    {spacing: 8}
  );

  t.equal(countTreeNodes(rootNode), 5);
  t.equal(rootNode.name, '', 'rootNode.name');
  t.equal(rootNode.pointCount, 10, 'rootNode.pointCount');
  t.equal(rootNode.header.childCount, 2, 'rootNode.childCount');
  t.equal(rootNode.header.childMask, 0b00001001, 'rootNode.childMask');
  t.equal(rootNode.childrenByIndex[0].name, '0', 'root child 0');
  t.equal(rootNode.childrenByIndex[3].name, '3', 'root child 3');
  t.equal(rootNode.childrenByIndex[3].childrenByIndex[6].name, '36', 'nested child');
  t.equal(rootNode.childrenByIndex[3].spacing, 4, 'child spacing');
  t.equal(rootNode.childrenByIndex[3].childrenByIndex[6].spacing, 2, 'nested child spacing');
  t.end();
});

test('PotreeNodesSource#initialize preserves direct cloud.js URL', async t => {
  const loadedUrls: string[] = [];
  const sourceUrl = 'https://potree.github.io/potree/pointclouds/vol_total/cloud.js';
  const coreApi = {
    load: async (url: string) => {
      loadedUrls.push(url);
      return {
        version: '1.4',
        octreeDir: 'data',
        points: 10,
        projection: '',
        boundingBox: {lx: 0, ly: 0, lz: 0, ux: 1, uy: 1, uz: 1},
        tightBoundingBox: {lx: 0, ly: 0, lz: 0, ux: 1, uy: 1, uz: 1},
        pointAttributes: ['POSITION_CARTESIAN'],
        spacing: 1,
        scale: 0.01,
        hierarchyStepSize: 5,
        hierarchy: [['r', 10]]
      };
    }
  } as unknown as CoreAPI;

  const dataSource = new PotreeNodesSource(
    sourceUrl,
    {
      core: {type: 'potree'},
      potree: {}
    },
    coreApi
  );
  await dataSource.initialize();

  t.equal(loadedUrls[0], sourceUrl, 'loads the exact cloud.js URL passed by the app');
  t.equal(
    dataSource.baseUrl,
    'https://potree.github.io/potree/pointclouds/vol_total',
    'uses the cloud.js directory as payload base URL'
  );
  t.end();
});

function countTreeNodes(node) {
  let count = 1;
  for (const child of node.children) {
    count += countTreeNodes(child);
  }
  return count;
}
