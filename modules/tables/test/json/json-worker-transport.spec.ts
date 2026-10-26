// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {deserializeJSONWorkerResult} from '../../src/json/lib/json-worker-transport';
import {serializeArrowWorkerResult} from '@loaders.gl/core/schema-utils/arrow-transport';
import {getTransferList} from '@loaders.gl/core/worker-utils';
import {serializeJSONWorkerBatch} from '../../src/json/lib/json-worker-transport';

test('JSON Arrow transport owns outgoing IPC buffers and rejects decoded object payloads', () => {
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
  expect(() => serializeJSONWorkerBatch(metadata)).toThrow('Arrow table output');
  expect(() => serializeJSONWorkerBatch({shape: 'object-row-table', data: [{id: 1}]})).toThrow(
    'Arrow table output'
  );
});

test('JSON hydrates legacy Arrow custom-worker payloads', () => {
  const serialized = serializeArrowWorkerResult({
    shape: 'arrow-table',
    data: tableFromArrays({id: new Int32Array([1])})
  });
  const received = deserializeJSONWorkerResult(serialized);
  expect(received.data).toBeInstanceOf(Table);
  expect(received.data.getChild('id')?.get(0)).toBe(1);
});
