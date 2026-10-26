// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {tableFromArrays} from 'apache-arrow';
import {
  deserializeArrowIPCWorkerResult,
  serializeArrowIPCWorkerResult,
  serializeArrowWorkerResult
} from '@loaders.gl/core/schema-utils/arrow-transport';

test('IPC worker transport owns dictionary and mesh index buffers across batch transfers', () => {
  const data = tableFromArrays({label: ['first', 'second']});
  const indices = {value: new Uint16Array([0, 1]), size: 1};
  const payload = serializeArrowIPCWorkerResult({
    shape: 'arrow-table',
    data: data.slice(0, 1),
    indices,
    batchType: 'data',
    length: 1
  }) as any;
  const received = structuredClone(payload, {
    transfer: [payload.data.data.buffer, payload.indices.value.buffer]
  });
  const table = deserializeArrowIPCWorkerResult(received);
  expect(table.data.getChild('label').get(0)).toBe('first');
  expect(table).toMatchObject({batchType: 'data', length: 1});
  expect(Array.from(table.indices.value)).toEqual([0, 1]);
  expect(data.getChild('label')!.get(1)).toBe('second');
  expect(Array.from(indices.value)).toEqual([0, 1]);
});

test('IPC worker hydration keeps older custom-worker Arrow payloads usable', () => {
  const original = {shape: 'arrow-table', data: tableFromArrays({id: new Int32Array([1])})};
  expect(
    deserializeArrowIPCWorkerResult(serializeArrowWorkerResult(original)).data.getChild('id').get(0)
  ).toBe(1);
  const legacyMesh = {attributes: {POSITION: {value: new Float32Array([1, 2, 3]), size: 3}}};
  expect(deserializeArrowIPCWorkerResult(legacyMesh)).toBe(legacyMesh);
  expect(deserializeArrowIPCWorkerResult(null)).toBeNull();
});

test.each([
  null,
  {shape: 'mesh'},
  {shape: 'arrow-table', data: {}}
])('IPC worker serialization rejects non-columnar output %j', result => {
  expect(() => serializeArrowIPCWorkerResult(result)).toThrow('Arrow table wrappers');
});
