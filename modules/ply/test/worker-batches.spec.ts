// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {PLYLoader} from '@loaders.gl/ply';

const source = [
  'ply',
  'format ascii 1.0',
  'element vertex 3',
  'property float x',
  'property float y',
  'property float z',
  'end_header',
  '1 2 3',
  '4 5 6',
  '7 8 9',
  ''
].join('\n');

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  'arrow-table',
  'mesh'
] as const)('PLY worker batches transfer column transport before %s conversion', async shape => {
  const parser = await PLYLoader.preload();
  const mainParser = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const batches = await parseInBatches(
    [new TextEncoder().encode(source)],
    {
      ...PLYLoader,
      preload: async () => ({
        ...parser,
        parseInBatches: mainParser,
        deserializeWorkerBatch: deserialize
      })
    },
    {core: {worker: true, _workerType: 'test', batchSize: 2}, ply: {shape, pointCloud: true}}
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

test('PLY atomic worker uses column transport before caller-side mesh conversion', async () => {
  const parser = await PLYLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const mesh = await parse(
    new TextEncoder().encode(source),
    {...PLYLoader, preload: async () => ({...parser, deserializeWorkerResult: deserialize})},
    {core: {worker: true, _workerType: 'test'}, ply: {shape: 'mesh'}}
  );
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-js'}
  });
  expect(mesh.loader).toBe('ply');
  expect(mesh.loaderData).toBeTruthy();
});

test('PLY binary worker batches preserve records split across input chunks', async () => {
  const header = new TextEncoder().encode(
    [
      'ply',
      'format binary_little_endian 1.0',
      'element vertex 3',
      'property float x',
      'property float y',
      'property float z',
      'end_header',
      ''
    ].join('\n')
  );
  const bytes = new Uint8Array(header.length + 36);
  bytes.set(header);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < 9; index++)
    view.setFloat32(header.length + index * 4, index + 1, true);
  const split = header.length + 13;
  const batches = await parseInBatches([bytes.slice(0, split), bytes.slice(split)], PLYLoader, {
    core: {worker: true, _workerType: 'test', batchSize: 2},
    ply: {shape: 'arrow-table', pointCloud: true}
  });
  const lengths: number[] = [];
  const positions: number[] = [];
  for await (const batch of batches) {
    expect(batch.loaderData.format).toBe('binary_little_endian');
    expect(batch.loaderData.elements[0].count).toBe(3);
    lengths.push(batch.length);
    for (const position of batch.data.getChild('POSITION')!) positions.push(...position);
  }
  expect(lengths).toEqual([2, 1]);
  expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('Worker hydration rejects decoded mesh payloads', async () => {
  const parser = await PLYLoader.preload();
  const mesh = {attributes: {POSITION: {value: new Float32Array([1, 2, 3]), size: 3}}};
  expect(() => parser.deserializeWorkerResult(mesh, {ply: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
  expect(() => parser.deserializeWorkerBatch(mesh, {ply: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
});

test('PLY worker mesh batches preserve faces and original header descriptors', async () => {
  const text =
    source.replace(
      'end_header',
      'element face 1\nproperty list uchar int vertex_indices\nend_header'
    ) + '3 0 1 2\n';
  const batches = await parseInBatches([new TextEncoder().encode(text)], PLYLoader, {
    core: {worker: true, _workerType: 'test'},
    ply: {shape: 'mesh'}
  });
  const meshes = [];
  for await (const mesh of batches) meshes.push(mesh);
  expect(meshes).toHaveLength(1);
  expect(Array.from(meshes[0].indices.value)).toEqual([0, 1, 2]);
  expect(meshes[0].loaderData.elements.map(element => element.name)).toEqual(['vertex', 'face']);
});

test('PLY column transport hydration defaults to Arrow when caller options are omitted', async () => {
  const parser = await PLYLoader.preload();
  const table = await parser.parse(new TextEncoder().encode(source).buffer, {
    ply: {shape: 'arrow-table'}
  });
  const payload = parser.serializeWorkerResult(table);
  expect(parser.deserializeWorkerResult(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerResult(payload, {}).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload, {}).data).toBeInstanceOf(Table);
});

test.each([
  false,
  true
])('PLY source headers survive color conversion with worker=%s', async worker => {
  const text = source
    .replace('format ascii 1.0', 'format ascii 1.0\ncomment retained source header')
    .replace(
      'end_header',
      'property uchar red\nproperty uchar green\nproperty uchar blue\nend_header'
    )
    .replace('1 2 3\n', '1 2 3 255 0 0\n')
    .replace('4 5 6\n', '4 5 6 0 255 0\n')
    .replace('7 8 9\n', '7 8 9 0 0 255\n');
  const batches = await parseInBatches([new TextEncoder().encode(text)], PLYLoader, {
    core: {worker, _workerType: 'test', batchSize: 2},
    ply: {shape: 'arrow-table', pointCloud: true, colorFormat: 'float32'}
  });
  let count = 0;
  for await (const batch of batches) {
    expect(batch.loaderData).toMatchObject({
      format: 'ascii',
      comments: ['retained source header'],
      elements: [{name: 'vertex', count: 3}]
    });
    count++;
  }
  expect(count).toBe(2);
});
