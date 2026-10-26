// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {deserializeArrowWorkerResult} from '@loaders.gl/core/schema-utils/arrow-transport';
import {getTransferList} from '@loaders.gl/core/worker-utils';
import {serializeJSONWorkerBatch} from '../../src/json/lib/json-worker-transport';

test('JSON Arrow transport owns outgoing buffers and preserves non-data metadata', () => {
  const values = new Int32Array([1, 2, 3]);
  const table = tableFromArrays({id: values});
  const serialized = serializeJSONWorkerBatch({
    shape: 'arrow-table',
    batchType: 'data',
    length: 1,
    data: table.slice(0, 1)
  });
  const received = deserializeArrowWorkerResult(
    structuredClone(serialized, {transfer: getTransferList(serialized)})
  );
  expect(received.data).toBeInstanceOf(Table);
  expect(received.data.getChild('id').get(0)).toBe(1);
  expect(table.getChild('id')?.get(2)).toBe(3);
  expect(Array.from(values)).toEqual([1, 2, 3]);
  const metadata = {shape: 'json', batchType: 'final-result', container: {tail: true}};
  expect(serializeJSONWorkerBatch(metadata)).toBe(metadata);
});
