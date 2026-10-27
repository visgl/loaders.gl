// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {PCDLoader} from '@loaders.gl/pointclouds/pcd';

const source = [
  'VERSION .7',
  'FIELDS x y z',
  'SIZE 4 4 4',
  'TYPE F F F',
  'COUNT 1 1 1',
  'WIDTH 3',
  'HEIGHT 1',
  'POINTS 3',
  'DATA ascii',
  '1 2 3',
  '4 5 6',
  '7 8 9',
  ''
].join('\n');

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  'arrow-table',
  'mesh'
] as const)('PCD worker batches transfer column transport before %s conversion', async shape => {
  const parser = await PCDLoader.preload();
  const mainParser = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const batches = await parseInBatches(
    [new TextEncoder().encode(source)],
    {
      ...PCDLoader,
      preload: async () => ({
        ...parser,
        parseInBatches: mainParser,
        deserializeWorkerBatch: deserialize
      })
    },
    {core: {worker: true, _workerType: 'test', batchSize: 2}, pcd: {shape}}
  );
  const positions: number[] = [];
  for await (const batch of batches) {
    if (shape === 'arrow-table') {
      expect(batch.data).toBeInstanceOf(Table);
      for (const position of batch.data.getChild('POSITION')!) positions.push(...position);
    } else {
      const mesh = batch;
      positions.push(...mesh.attributes.POSITION.value);
    }
  }
  expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(mainParser).not.toHaveBeenCalled();
  expect(deserialize).toHaveBeenCalledTimes(2);
  for (const [payload] of deserialize.mock.calls) {
    expect(payload).toMatchObject({shape: 'arrow-table', data: {transport: 'arrow-js'}});
    expect((payload as any).data.batches).toBeInstanceOf(Array);
  }
});

test('PCD atomic worker uses column transport before caller-side mesh conversion', async () => {
  const parser = await PCDLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const mesh = await parse(
    new TextEncoder().encode(source),
    {...PCDLoader, preload: async () => ({...parser, deserializeWorkerResult: deserialize})},
    {core: {worker: true, _workerType: 'test'}, pcd: {shape: 'mesh'}}
  );
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-js'}
  });
  expect(mesh.loader).toBe('pcd');
  expect(mesh.loaderData).toBeTruthy();
});

test('PCD binary worker batches preserve records split across input chunks', async () => {
  const header = new TextEncoder().encode(
    source.slice(0, source.indexOf('DATA ascii')) + 'DATA binary\n'
  );
  const bytes = new Uint8Array(header.length + 36);
  bytes.set(header);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < 9; index++)
    view.setFloat32(header.length + index * 4, index + 1, true);
  const split = header.length + 13;
  const batches = await parseInBatches([bytes.slice(0, split), bytes.slice(split)], PCDLoader, {
    core: {worker: true, _workerType: 'test', batchSize: 2},
    pcd: {shape: 'arrow-table'}
  });
  const lengths: number[] = [];
  const positions: number[] = [];
  for await (const batch of batches) {
    lengths.push(batch.length);
    for (const position of batch.data.getChild('POSITION')!) positions.push(...position);
  }
  expect(lengths).toEqual([2, 1]);
  expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('Worker hydration rejects decoded mesh payloads', async () => {
  const parser = await PCDLoader.preload();
  const mesh = {attributes: {POSITION: {value: new Float32Array([1, 2, 3]), size: 3}}};
  expect(() => parser.deserializeWorkerResult(mesh, {pcd: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
  expect(() => parser.deserializeWorkerBatch(mesh, {pcd: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
});

test('PCD column transport hydration defaults to Arrow when caller options are omitted', async () => {
  const parser = await PCDLoader.preload();
  const table = await parser.parse(new TextEncoder().encode(source).buffer, {
    pcd: {shape: 'arrow-table'}
  });
  const payload = parser.serializeWorkerResult(table);
  expect(parser.deserializeWorkerResult(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerResult(payload, {}).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload, {}).data).toBeInstanceOf(Table);
});
