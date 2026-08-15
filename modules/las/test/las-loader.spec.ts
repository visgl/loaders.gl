// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {LASLoader, LASWorkerLoader} from '@loaders.gl/las';
import {validateLoader} from 'test/common/conformance';

const PDRF_4_LAS_URL = '@loaders.gl/las/test/data/pdrf4-1.3.las';
const PDRF_4_LAZ_URL = '@loaders.gl/las/test/data/pdrf4-1.3.laz';
const POINT_COUNT = 1024;

test('LASLoader#loader conformance', () => {
  validateLoader(LASLoader, 'LASLoader');
  validateLoader(LASWorkerLoader, 'LASWorkerLoader');
});

test('LASLoader#small uncompressed and compressed fixtures agree', async () => {
  const lasArrayBuffer = await (await fetchFile(PDRF_4_LAS_URL)).arrayBuffer();
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const loaderOptions = {las: {backend: 'typescript' as const}, core: {worker: false}};
  const uncompressed = await parse(lasArrayBuffer, LASLoader, loaderOptions);
  const compressed = await parse(lazArrayBuffer, LASLoader, loaderOptions);

  expect(compressed.header.vertexCount).toBe(POINT_COUNT);
  expect(compressed.loaderData.versionAsString).toBe('1.3');
  expect(compressed.loaderData.pointsFormatId).toBe(4);
  expect(compressed.attributes.POSITION.value).toEqual(uncompressed.attributes.POSITION.value);
  expect(compressed.attributes.intensity.value).toEqual(uncompressed.attributes.intensity.value);
  expect(compressed.attributes.classification.value).toEqual(
    uncompressed.attributes.classification.value
  );
});

test('LASLoader#small fixture streams requested mesh batches', async () => {
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const batches = await parseInBatches(lazArrayBuffer, LASLoader, {
    batchSize: 127,
    las: {backend: 'typescript'},
    core: {worker: false}
  });
  const batchVertexCounts: number[] = [];

  for await (const batch of batches as AsyncIterable<any>) {
    batchVertexCounts.push(batch.header.vertexCount);
    expect(batch.attributes.POSITION.value.length).toBe(batch.header.vertexCount * 3);
  }

  expect(batchVertexCounts).toEqual([...new Array(8).fill(127), 8]);
});

test('LASLoader#small fixture emits an Arrow table', async () => {
  const lazArrayBuffer = await (await fetchFile(PDRF_4_LAZ_URL)).arrayBuffer();
  const table = await parse(lazArrayBuffer, LASLoader, {
    las: {backend: 'typescript', shape: 'arrow-table'},
    core: {worker: false}
  });

  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(POINT_COUNT);
  expect(table.data.getChild('POSITION')).toBeTruthy();
  expect(table.data.getChild('intensity')).toBeTruthy();
});
