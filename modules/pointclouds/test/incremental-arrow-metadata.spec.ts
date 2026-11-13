// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {makeTableFromBatches} from '@loaders.gl/core/schema-utils';
import {PLYLoaderWithParser} from '../src/ply/ply-loader';
import {PCDLoaderWithParser} from '../src/pcd/pcd-loader';

const positions = '1 2 3\n-1 4 0\n';
const ply =
  'ply\nformat ascii 1.0\nelement vertex 2\nproperty float x\nproperty float y\nproperty float z\nend_header\n' +
  positions;
const pcd =
  'VERSION .7\nFIELDS x y z\nSIZE 4 4 4\nTYPE F F F\nCOUNT 1 1 1\nWIDTH 2\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS 2\nDATA ascii\n' +
  positions;

test.each([
  'ply',
  'pcd'
] as const)('%s Arrow batches refine bounds without changing earlier snapshots', async format => {
  const loader = format === 'ply' ? PLYLoaderWithParser : PCDLoaderWithParser;
  const bytes = new TextEncoder().encode(format === 'ply' ? ply : pcd).buffer;
  const options = {core: {batchSize: 1}, [format]: {shape: 'arrow-table', pointCloud: true}};
  const batches: any[] = [];
  for await (const batch of loader.parseInBatches([bytes], options as any)) batches.push(batch);
  expect(batches).toHaveLength(2);
  expect(batches[0].data.schema.metadata.get('boundingBox')).toBe('[[1,2,3],[1,2,3]]');
  expect(batches[1].data.schema.metadata.get('boundingBox')).toBe('[[-1,2,0],[1,4,3]]');
  expect(batches[1].data.batches[0].metadata.get('boundingBox')).toBe('[[-1,4,0],[-1,4,0]]');
  const collected = await makeTableFromBatches(batches);
  const full: any = await loader.parse(bytes, options as any);
  expect(collected?.schema?.metadata).toEqual(full.schema.metadata);
});
