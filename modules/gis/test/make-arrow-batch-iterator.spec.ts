// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {makeTableToArrowBatchesIterator} from '../src/lib/table-converters/make-arrow-batch-iterator';

const SCHEMA = {
  fields: [
    {name: 'id', type: 'int32', nullable: false},
    {name: 'name', type: 'utf8', nullable: true}
  ],
  metadata: {}
};

describe('makeTableToArrowBatchesIterator', () => {
  test('creates row-aligned batches from object rows', () => {
    const table = {
      shape: 'object-row-table' as const,
      schema: SCHEMA,
      data: [{id: 1, name: 'one'}, {id: 2, name: 'two'}, {id: 3, name: null}, {id: 4}]
    };
    const batches = Array.from(makeTableToArrowBatchesIterator(table as any, {batchSize: 2}));

    expect(batches.map(batch => batch.numRows)).toEqual([2, 2]);
    expect(batches[0].getChild('id')?.toArray()).toEqual(new Int32Array([1, 2]));
    expect(batches[0].getChild('name')?.toArray()).toEqual(['one', 'two']);
    expect(batches[1].getChild('id')?.get(0)).toBe(3);
    expect(batches[1].getChild('name')?.get(0)).toBeNull();
    expect(batches[1].getChild('name')?.get(1)).toBeNull();
  });

  test('uses the table length as the default batch size', () => {
    const table = {
      shape: 'columnar-table' as const,
      schema: SCHEMA,
      data: {id: new Int32Array([4, 5]), name: ['four', 'five']}
    };
    const batches = Array.from(makeTableToArrowBatchesIterator(table as any));
    expect(batches).toHaveLength(1);
    expect(batches[0].numRows).toBe(2);
  });

  test('returns no batches for an empty table', () => {
    const table = {shape: 'object-row-table' as const, schema: SCHEMA, data: []};
    expect(Array.from(makeTableToArrowBatchesIterator(table as any))).toEqual([]);
  });
});
