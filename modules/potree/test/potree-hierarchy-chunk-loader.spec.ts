import {expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import type {CoreAPI} from '@loaders.gl/loader-utils';
import {PotreeHierarchyChunkLoader} from '@loaders.gl/potree';
import {PotreeNodesSource} from '../src/lib/potree-node-source';
import {buildPotreeHierarchyFromMetadata} from '../src/parsers/parse-potree-hierarchy-chunk';
const POTREE_HIERARCHY_CHUNK_URL = '@loaders.gl/potree/test/data/lion_takanawa/data/r/r.hrc';
test('PotreeHierarchyChunkLoader#parse', async () => {
  const response = await fetchFile(POTREE_HIERARCHY_CHUNK_URL);
  const rootNode = await parse(response, PotreeHierarchyChunkLoader);
  expect(countTreeNodes(rootNode)).toBe(167);
  expect(rootNode.name, 'rootNode.name').toBe('');
  expect(rootNode.pointCount, 'rootNode.pointCount').toBe(3751);
  expect(rootNode.header.childCount, 'rootNode.childCount').toBe(6);
  expect(rootNode.children.length, 'rootNode.children').toBe(6);
  expect(rootNode.childrenByIndex.length, 'rootNode.childrenByIndex').toBe(8);
});
test('buildPotreeHierarchyFromMetadata', () => {
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
  expect(countTreeNodes(rootNode)).toBe(5);
  expect(rootNode.name, 'rootNode.name').toBe('');
  expect(rootNode.pointCount, 'rootNode.pointCount').toBe(10);
  expect(rootNode.header.childCount, 'rootNode.childCount').toBe(2);
  expect(rootNode.header.childMask, 'rootNode.childMask').toBe(0b00001001);
  expect(rootNode.childrenByIndex[0].name, 'root child 0').toBe('0');
  expect(rootNode.childrenByIndex[3].name, 'root child 3').toBe('3');
  expect(rootNode.childrenByIndex[3].childrenByIndex[6].name, 'nested child').toBe('36');
  expect(rootNode.childrenByIndex[3].spacing, 'child spacing').toBe(4);
  expect(rootNode.childrenByIndex[3].childrenByIndex[6].spacing, 'nested child spacing').toBe(2);
});
test('PotreeNodesSource#initialize preserves direct cloud.js URL', async () => {
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
  expect(loadedUrls[0], 'loads the exact cloud.js URL passed by the app').toBe(sourceUrl);
  expect(dataSource.baseUrl, 'uses the cloud.js directory as payload base URL').toBe(
    'https://potree.github.io/potree/pointclouds/vol_total'
  );
});
function countTreeNodes(node) {
  let count = 1;
  for (const child of node.children) {
    count += countTreeNodes(child);
  }
  return count;
}
