// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {tightenArrowTableSchemaNullability} from '@loaders.gl/arrow';
import type {ArrowTable} from '@loaders.gl/schema';
test('tightenArrowTableSchemaNullability#tightens nullable fields without nulls', async () => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: true
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable.schema?.fields[0].nullable, 'loaders.gl schema is tightened').toBe(false);
  expect(tightenedTable.data.schema.fields[0].nullable, 'Arrow schema is tightened').toBe(false);
  expect(tightenedTable.data.getChildAt(0)?.get(1), 'column values are preserved').toBe('b');
  expect(tightenedTable.data, 'Arrow table wrapper is replaced').not.toBe(table.data);
});
test('tightenArrowTableSchemaNullability#keeps nullable fields with nulls', async () => {
  const table = makeTestArrowTable({
    values: ['a', null, 'c'],
    nullable: true
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable, 'table is reused when nullability is unchanged').toBe(table);
  expect(tightenedTable.schema?.fields[0].nullable, 'loaders.gl schema stays nullable').toBe(true);
  expect(tightenedTable.data.schema.fields[0].nullable, 'Arrow schema stays nullable').toBe(true);
});
test('tightenArrowTableSchemaNullability#keeps non-nullable fields unchanged', async () => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: false
  });
  const tightenedTable = tightenArrowTableSchemaNullability(table);
  expect(tightenedTable, 'table is reused when schema is already non-nullable').toBe(table);
  expect(tightenedTable.schema?.fields[0].nullable, 'loaders.gl schema stays non-nullable').toBe(
    false
  );
  expect(tightenedTable.data.schema.fields[0].nullable, 'Arrow schema stays non-nullable').toBe(
    false
  );
});
/** Test table construction options. */
type TestArrowTableOptions = {
  values: (string | null)[];
  nullable: boolean;
};
/** Creates a single-column ArrowTable with explicit field nullability. */
function makeTestArrowTable(options: TestArrowTableOptions): ArrowTable {
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
  const data = new arrow.Table([recordBatch]);
  return {
    shape: 'arrow-table',
    schema: convertArrowToSchema(data.schema),
    data
  };
}
