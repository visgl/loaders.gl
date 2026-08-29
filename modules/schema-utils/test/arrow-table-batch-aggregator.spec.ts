// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {ArrowTableBatchAggregator} from '../src/lib/table/batch-builder/arrow-table-batch-aggregator';

const FLOAT_SCHEMA = {
  fields: [{name: 'value', type: 'float32', nullable: false}],
  metadata: {}
};

describe('ArrowTableBatchAggregator', () => {
  test('converts array and object rows into an Arrow table batch', () => {
    const aggregator = new ArrowTableBatchAggregator(FLOAT_SCHEMA as any, {});
    expect(aggregator.rowCount()).toBe(0);
    aggregator.addArrayRow([1.5]);
    aggregator.addObjectRow({value: 2.5});

    const batch = aggregator.getBatch();
    expect(batch).toMatchObject({shape: 'arrow-table', batchType: 'data', length: 2});
    expect(batch?.data.getChild('value')?.toArray()).toEqual(new Float32Array([1.5, 2.5]));
    expect(aggregator.arrowSchema?.fields[0].name).toBe('value');
  });

  test('reuses the Arrow schema across batches', () => {
    const aggregator = new ArrowTableBatchAggregator(FLOAT_SCHEMA as any, {});
    aggregator.addObjectRow({value: 1});
    aggregator.getBatch();
    const firstSchema = aggregator.arrowSchema;
    aggregator.getBatch();
    expect(aggregator.arrowSchema).toBe(firstSchema);
  });

  test('rejects schemas and columns that cannot be represented', () => {
    const unsupported = new ArrowTableBatchAggregator(
      {fields: [{name: 'count', type: 'int32', nullable: false}], metadata: {}} as any,
      {}
    );
    unsupported.addArrayRow([1]);
    expect(() => unsupported.getBatch()).toThrow('No arrow convertible fields');

    const mixed = new ArrowTableBatchAggregator(
      {
        fields: [
          {name: 'value', type: 'float32', nullable: false},
          {name: 'count', type: 'int32', nullable: false}
        ],
        metadata: {}
      } as any,
      {}
    );
    mixed.addArrayRow([1, 2]);
    expect(() => mixed.getBatch()).toThrow('Some schema fields are not arrow convertible');

    const invalidColumn = new ArrowTableBatchAggregator(FLOAT_SCHEMA as any, {});
    invalidColumn.addArrayRow([1]);
    invalidColumn.columns.value = [1];
    expect(() => invalidColumn.getBatch()).toThrow('Some columns not arrow convertible');
  });
});
