// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table, RecordBatch} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import {destroyWorkerTasks} from '@loaders.gl/core/worker-utils';
import {OBJLoader} from '@loaders.gl/scene/obj';
import * as bundled from '../../src/obj/bundled';

const source = ['v 1 2 3', 'v 4 5 6', 'v 7 8 9', ''].join('\n');

afterEach(() => destroyWorkerTasks());

test.each([
  'arrow',
  'mesh'
] as const)('OBJ worker batches transfer column transport before %s conversion', async shape => {
  const parser = await OBJLoader.preload();
  const mainParser = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const batches = await parseInBatches(
    [new TextEncoder().encode(source)],
    {
      ...OBJLoader,
      preload: async () => ({
        ...parser,
        parseInBatches: mainParser,
        deserializeWorkerBatch: deserialize
      })
    },
    {core: {worker: true, _workerType: 'test', batchSize: 2}, obj: {shape, pointCloud: true}}
  );
  const positions: number[] = [];
  for await (const batch of batches) {
    if (shape === 'arrow') {
      expect(batch).toBeInstanceOf(RecordBatch);
      for (const position of batch.getChild('POSITION')!) positions.push(...position);
    } else {
      const mesh = batch.data;
      positions.push(...mesh.attributes.POSITION.value);
    }
  }
  expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(mainParser).not.toHaveBeenCalled();
  expect(deserialize).toHaveBeenCalledTimes(2);
  for (const [payload] of deserialize.mock.calls) {
    expect(payload).toMatchObject({
      transport: 'arrow-column-envelope',
      data: {transport: 'arrow-js'}
    });
    expect((payload as any).data.batches).toBeInstanceOf(Array);
  }
});

test('OBJ atomic worker uses column transport before caller-side mesh conversion', async () => {
  const parser = await OBJLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const mesh = await parse(
    new TextEncoder().encode(source + 'f 1 2 3\n'),
    {...OBJLoader, preload: async () => ({...parser, deserializeWorkerResult: deserialize})},
    {core: {worker: true, _workerType: 'test'}, obj: {shape: 'mesh'}}
  );
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    transport: 'arrow-column-envelope',
    data: {transport: 'arrow-js'}
  });
});

test('OBJ emits worker batches before EOF and cancels blocked input promptly', async () => {
  let releaseInput!: () => void;
  const blocked = new Promise<void>(resolve => {
    releaseInput = resolve;
  });
  let inputClosed = false;
  /** Keeps the producer blocked after its first complete vertex batch. */
  async function* input() {
    try {
      yield new TextEncoder().encode('v 1 2 3\nv 4 5 6\n');
      await blocked;
      yield new TextEncoder().encode('v 7 8 9\n');
    } finally {
      inputClosed = true;
    }
  }
  const controller = new AbortController();
  try {
    const batches = await parseInBatches(input(), OBJLoader, {
      signal: controller.signal,
      core: {worker: true, _workerType: 'test', batchSize: 2},
      obj: {pointCloud: true, shape: 'arrow'}
    });
    const iterator = batches[Symbol.asyncIterator]();
    const first = await iterator.next();
    expect(first.value.numRows).toBe(2);
    controller.abort(new Error('cancel OBJ input'));
    await expect(iterator.next()).rejects.toThrow('cancel OBJ input');
  } finally {
    releaseInput();
    await vi.waitFor(() => expect(inputClosed).toBe(true));
  }
  const mesh = await parse(new TextEncoder().encode(source + 'f 1 2 3\n'), OBJLoader, {
    core: {worker: true, _workerType: 'test'},
    obj: {shape: 'mesh'}
  });
  expect(mesh.header.vertexCount).toBe(3);
});

test('Worker hydration rejects decoded mesh payloads', async () => {
  const parser = await OBJLoader.preload();
  const mesh = {attributes: {POSITION: {value: new Float32Array([1, 2, 3]), size: 3}}};
  expect(() => parser.deserializeWorkerResult(mesh, {obj: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
  expect(() => parser.deserializeWorkerBatch(mesh, {obj: {shape: 'mesh'}})).toThrow(
    'Arrow column transport'
  );
});

test('OBJ column transport hydration defaults to Arrow when caller options are omitted', async () => {
  const parser = await OBJLoader.preload();
  const table = await parser.parse(new TextEncoder().encode(source).buffer, {
    obj: {shape: 'arrow'}
  });
  const payload = parser.serializeWorkerResult({shape: 'arrow-table', data: table});
  expect(parser.deserializeWorkerResult(payload)).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerResult(payload, {})).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload)).toBeInstanceOf(RecordBatch);
  expect(parser.deserializeWorkerBatch(payload, {})).toBeInstanceOf(RecordBatch);
});

test('OBJ bundled entrypoint retains OBJ and MTL parser and format exports', () => {
  expect(bundled.OBJFormat.id).toBe('obj');
  expect(bundled.MTLFormat.id).toBe('mtl');
  expect(bundled.OBJLoader.parse).toBeTypeOf('function');
  expect(bundled.MTLLoader.parseTextSync).toBeTypeOf('function');
  expect(bundled.MTLLoader.id).toBe('mtl');
});

test('OBJ worker preserves cumulative and batch-local bounds', async () => {
  const iterator = await parseInBatches(
    [new TextEncoder().encode('v 1 2 3\nv -1 4 0\n')],
    OBJLoader,
    {
      core: {worker: true, _workerType: 'test', batchSize: 1},
      obj: {shape: 'arrow', pointCloud: true}
    }
  );
  const batches: any[] = [];
  for await (const batch of iterator) batches.push(batch);
  expect(batches[0].schema.metadata.get('boundingBox')).toBe('[[1,2,3],[1,2,3]]');
  expect(batches[1].schema.metadata.get('boundingBox')).toBe('[[-1,2,0],[1,4,3]]');
  expect(batches[1].metadata.get('boundingBox')).toBe('[[-1,4,0],[-1,4,0]]');
});
