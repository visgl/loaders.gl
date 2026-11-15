// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {tightenArrowTableSchemaNullability} from '@loaders.gl/tables/arrow/index';
test('tightenArrowTableSchemaNullability#tightens nullable fields without nulls', async () => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: true
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable.schema.fields[0].nullable, 'Arrow schema is tightened').toBe(false);
  expect(tightenedTable.getChildAt(0)?.get(1), 'column values are preserved').toBe('b');
  expect(tightenedTable, 'Arrow table is replaced').not.toBe(table);
});
test('tightenArrowTableSchemaNullability#keeps nullable fields with nulls', async () => {
  const table = makeTestArrowTable({
    values: ['a', null, 'c'],
    nullable: true
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable, 'table is reused when nullability is unchanged').toBe(table);
  expect(tightenedTable.schema.fields[0].nullable, 'Arrow schema stays nullable').toBe(true);
});
test('tightenArrowTableSchemaNullability#keeps non-nullable fields unchanged', async () => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: false
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable, 'table is reused when schema is already non-nullable').toBe(table);
  expect(tightenedTable.schema.fields[0].nullable, 'Arrow schema stays non-nullable').toBe(false);
});
test('tightening keeps table and batch metadata snapshots independent', () => {
  const input = makeTestArrowTable({values: ['a'], nullable: true});
  const schema = new arrow.Schema(input.schema.fields, new Map([['stage', 'table']]));
  const batchSchema = new arrow.Schema(input.schema.fields, new Map([['stage', 'batch']]));
  const batch = new arrow.RecordBatch(
    batchSchema,
    input.batches[0].data,
    new Map([['partition', 'first']])
  );
  const tightened = tightenArrowTableSchemaNullability(new arrow.Table(schema, [batch]));
  expect(tightened.schema.metadata.get('stage')).toBe('table');
  expect(tightened.batches[0].schema.metadata.get('stage')).toBe('batch');
  expect(tightened.batches[0].metadata.get('partition')).toBe('first');
  expect(tightened.batches[0].schema.fields[0].nullable).toBe(false);
  expect(batch.schema.fields[0].nullable).toBe(true);
});

/** Test table construction options. */
type TestArrowTableOptions = {
  values: (string | null)[];
  nullable: boolean;
};
/** Creates a single-column ArrowTable with explicit field nullability. */
function makeTestArrowTable(options: TestArrowTableOptions): arrow.Table {
  const vector = arrow.vectorFromArray(options.values, new arrow.Utf8());
  const field = new arrow.Field('name', vector.type, options.nullable);
  const schema = new arrow.Schema([field]);
  const recordBatch = new arrow.RecordBatch(
    schema,
    arrow.makeData({
      type: new arrow.Struct(schema.fields),
      length: vector.length,
      children: [vector.data[0]]
    })
  );
  return new arrow.Table([recordBatch]);
}
