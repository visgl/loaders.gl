// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {deduceMeshSchema} from '@loaders.gl/core/schema-utils';
import {encode, fetchFile, parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {LASLoader, LASWriter} from '../../src/las/index';
import {LAZRsLoaderWithParser} from '../../src/las/laz-rs-loader';
import {LAZPerfLoaderWithParser} from '../../src/las/lazperf-loader';

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  'las',
  'laz'
] as const)('primary LAS worker streams %s column batches with caller mesh conversion', async extension => {
  const source = await (
    await fetchFile(`@loaders.gl/pointclouds/las/test/data/pdrf7-v4-1.4.${extension}`)
  ).arrayBuffer();
  const parser = await LASLoader.preload();
  const expected: any = await parse(source.slice(0), LASLoader, {core: {worker: false}});
  const mainBatches = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const loader = {
    ...LASLoader,
    preload: async () => ({
      ...parser,
      parseInBatches: mainBatches,
      deserializeWorkerBatch: deserialize
    })
  };
  for (const shape of ['arrow-table', 'mesh'] as const) {
    const input = Array.from({length: Math.ceil(source.byteLength / 257)}, (_, index) =>
      source.slice(index * 257, (index + 1) * 257)
    );
    const batches = await parseInBatches(input, loader, {
      core: {worker: true, _workerType: 'test', batchSize: 127},
      las: {shape}
    });
    const positions: number[][] = [];
    for await (const batch of batches) {
      if (shape === 'arrow-table') {
        expect(batch.data).toBeInstanceOf(Table);
        positions.push(
          ...Array.from(batch.data.getChild('POSITION'), (row: any) => Array.from(row))
        );
      } else {
        const values = batch.attributes.POSITION.value;
        for (let index = 0; index < values.length; index += 3)
          positions.push(Array.from(values.slice(index, index + 3)));
      }
    }
    expect(positions).toEqual(
      Array.from(expected.data.getChild('POSITION'), (row: any) => Array.from(row))
    );
  }
  expect(mainBatches).not.toHaveBeenCalled();
  expect(deserialize.mock.calls.length).toBeGreaterThan(2);
  for (const [payload] of deserialize.mock.calls)
    expect(payload).toMatchObject({shape: 'arrow-table', data: {transport: 'arrow-js'}});
  const atomic: any = await parse(source.slice(0), LASLoader, {
    core: {worker: true, _workerType: 'test'}
  });
  expect(atomic.data).toBeInstanceOf(Table);
  expect(atomic.data.numRows).toBe(expected.data.numRows);
  expect(LAZRsLoaderWithParser.worker).toBe(false);
  expect(LAZPerfLoaderWithParser.worker).toBe(false);
});

test('primary LAS worker yields before EOF and releases a blocked stream on abort', async () => {
  const attributes = {POSITION: {value: new Float32Array([1, 2, 3, 4, 5, 6]), size: 3}};
  const buffer = await encode(
    {attributes, topology: 'point-list', schema: deduceMeshSchema(attributes)},
    LASWriter,
    {las: {version: '1.4', pointDataRecordFormat: 6}}
  );
  const view = new DataView(buffer);
  const firstRecordEnd = view.getUint32(96, true) + view.getUint16(105, true);
  let releaseInput!: () => void;
  const blocked = new Promise<void>(resolve => {
    releaseInput = resolve;
  });
  /** Leaves the producer blocked after the first complete point record. */
  async function* input() {
    yield buffer.slice(0, firstRecordEnd);
    await blocked;
    yield buffer.slice(firstRecordEnd);
  }
  const controller = new AbortController();
  try {
    const batches = await parseInBatches(input(), LASLoader, {
      signal: controller.signal,
      core: {worker: true, _workerType: 'test', batchSize: 1}
    });
    const iterator = batches[Symbol.asyncIterator]();
    expect((await iterator.next()).value.data.numRows).toBe(1);
    controller.abort(new Error('cancel LAS'));
    await expect(iterator.next()).rejects.toThrow('cancel LAS');
  } finally {
    releaseInput();
  }
  const reused: any = await parse(buffer.slice(0), LASLoader, {
    core: {worker: true, _workerType: 'test'}
  });
  expect(reused.data.numRows).toBe(2);
});
