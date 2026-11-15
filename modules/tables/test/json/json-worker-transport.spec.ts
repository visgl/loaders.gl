// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {RecordBatch, tableFromArrays} from 'apache-arrow';
import {deserializeJSONWorkerResult} from '../../src/json/lib/json-worker-transport';
import {getTransferList} from '@loaders.gl/core/worker-utils';
import {serializeJSONWorkerBatch} from '../../src/json/lib/json-worker-transport';

test('JSON Arrow transport owns outgoing column buffers and encodes metadata as binary JSON', () => {
  const values = new Int32Array([1, 2, 3]);
  const table = tableFromArrays({id: values});
  const serialized = serializeJSONWorkerBatch(table.batches[0].slice(0, 1));
  const received = deserializeJSONWorkerResult(
    structuredClone(serialized, {transfer: getTransferList(serialized)})
  ) as RecordBatch;
  expect(received).toBeInstanceOf(RecordBatch);
  expect(received.getChild('id')?.get(0)).toBe(1);
  expect(table.getChild('id')?.get(2)).toBe(3);
  expect(Array.from(values)).toEqual([1, 2, 3]);
  const metadata = {shape: 'json', batchType: 'final-result', container: {tail: true}};
  const serializedMetadata = serializeJSONWorkerBatch(metadata);
  expect(serializedMetadata).toMatchObject({transport: 'json-utf8', data: expect.any(Uint8Array)});
  expect(deserializeJSONWorkerResult(serializedMetadata)).toEqual(metadata);
});

test('JSON Arrow hydration rejects IPC payloads', () => {
  expect(() =>
    deserializeJSONWorkerResult({
      transport: 'arrow-ipc',
      data: new Uint8Array()
    })
  ).toThrow('Arrow column transport');
});
