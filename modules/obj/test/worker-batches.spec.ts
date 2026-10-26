// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table} from 'apache-arrow';
import {parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {OBJLoader} from '@loaders.gl/obj';
import * as bundled from '../src/bundled';

const source = ['v 1 2 3', 'v 4 5 6', 'v 7 8 9', ''].join('\n');

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

test.each([
  'arrow-table',
  'mesh'
] as const)('OBJ worker batches transfer IPC before %s conversion', async shape => {
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
    if (shape === 'arrow-table') {
      expect(batch.data).toBeInstanceOf(Table);
      for (const position of batch.data.getChild('POSITION')!) positions.push(...position);
    } else {
      const mesh = batch.data;
      positions.push(...mesh.attributes.POSITION.value);
    }
  }
  expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(mainParser).not.toHaveBeenCalled();
  expect(deserialize).toHaveBeenCalledTimes(2);
  for (const [payload] of deserialize.mock.calls) {
    expect(payload).toMatchObject({shape: 'arrow-table', data: {transport: 'arrow-ipc'}});
    expect((payload as any).data.data).toBeInstanceOf(Uint8Array);
  }
});

test('OBJ atomic worker uses IPC before caller-side mesh conversion', async () => {
  const parser = await OBJLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const mesh = await parse(
    new TextEncoder().encode(source + 'f 1 2 3\n'),
    {...OBJLoader, preload: async () => ({...parser, deserializeWorkerResult: deserialize})},
    {core: {worker: true, _workerType: 'test'}, obj: {shape: 'mesh'}}
  );
  expect(Array.from(mesh.attributes.POSITION.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-ipc'}
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
      obj: {pointCloud: true, shape: 'arrow-table'}
    });
    const iterator = batches[Symbol.asyncIterator]();
    const first = await iterator.next();
    expect(first.value.length).toBe(2);
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

test('Older custom workers keep legacy mesh payloads usable', async () => {
  const parser = await OBJLoader.preload();
  const mesh = {attributes: {POSITION: {value: new Float32Array([1, 2, 3]), size: 3}}};
  expect(parser.deserializeWorkerResult(mesh, {obj: {shape: 'mesh'}})).toBe(mesh);
  expect(parser.deserializeWorkerBatch(mesh, {obj: {shape: 'mesh'}})).toBe(mesh);
});

test('OBJ IPC hydration defaults to Arrow when caller options are omitted', async () => {
  const parser = await OBJLoader.preload();
  const table = await parser.parse(new TextEncoder().encode(source).buffer, {
    obj: {shape: 'arrow-table'}
  });
  const payload = parser.serializeWorkerResult(table);
  expect(parser.deserializeWorkerResult(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerResult(payload, {}).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload).data).toBeInstanceOf(Table);
  expect(parser.deserializeWorkerBatch(payload, {}).data).toBeInstanceOf(Table);
});

test('OBJ bundled entrypoint retains OBJ and MTL parser and format exports', () => {
  expect(bundled.OBJFormat.id).toBe('obj');
  expect(bundled.MTLFormat.id).toBe('mtl');
  expect(bundled.OBJLoader.parse).toBeTypeOf('function');
  expect(bundled.OBJWorkerLoader).toBe(bundled.OBJLoader);
  expect(bundled.MTLLoader.parseTextSync).toBeTypeOf('function');
  expect(bundled.MTLWorkerLoader.id).toBe('mtl');
});
