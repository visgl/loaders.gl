// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {deserializeJSONWorkerResult} from '../../src/json/lib/json-worker-transport';
import {getTransferList} from '@loaders.gl/core/worker-utils';
import {serializeJSONWorkerBatch} from '../../src/json/lib/json-worker-transport';

test('JSON Arrow transport owns outgoing column buffers and encodes metadata as binary JSON', () => {
  const values = new Int32Array([1, 2, 3]);
  const table = tableFromArrays({id: values});
  const serialized = serializeJSONWorkerBatch({
    shape: 'arrow-table',
    batchType: 'data',
    length: 1,
    data: table.slice(0, 1)
  });
  const received = deserializeJSONWorkerResult(
    structuredClone(serialized, {transfer: getTransferList(serialized)})
  );
  expect(received.data).toBeInstanceOf(Table);
  expect(received.data.getChild('id').get(0)).toBe(1);
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
      shape: 'arrow-table',
      data: {transport: 'arrow-ipc', data: new Uint8Array()}
    })
  ).toThrow('Arrow column transport');
});
