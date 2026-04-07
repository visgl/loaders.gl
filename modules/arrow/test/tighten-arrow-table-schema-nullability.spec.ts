// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {tightenArrowTableSchemaNullability} from '@loaders.gl/arrow';

import type {ArrowTable} from '@loaders.gl/schema';

test('tightenArrowTableSchemaNullability#tightens nullable fields without nulls', async (t) => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: true
  });

  const tightenedTable = tightenArrowTableSchemaNullability(table);

  t.equal(tightenedTable.schema?.fields[0].nullable, false, 'loaders.gl schema is tightened');
  t.equal(tightenedTable.data.schema.fields[0].nullable, false, 'Arrow schema is tightened');
  t.equal(tightenedTable.data.getChildAt(0)?.get(1), 'b', 'column values are preserved');
  t.notEqual(tightenedTable.data, table.data, 'Arrow table wrapper is replaced');
  t.end();
});

test('tightenArrowTableSchemaNullability#keeps nullable fields with nulls', async (t) => {
  const table = makeTestArrowTable({
    values: ['a', null, 'c'],
    nullable: true
  });

  const tightenedTable = tightenArrowTableSchemaNullability(table);

  t.equal(tightenedTable, table, 'table is reused when nullability is unchanged');
  t.equal(tightenedTable.schema?.fields[0].nullable, true, 'loaders.gl schema stays nullable');
  t.equal(tightenedTable.data.schema.fields[0].nullable, true, 'Arrow schema stays nullable');
  t.end();
});

test('tightenArrowTableSchemaNullability#keeps non-nullable fields unchanged', async (t) => {
  const table = makeTestArrowTable({
    values: ['a', 'b', 'c'],
    nullable: false
  });

  const tightenedTable = tightenArrowTableSchemaNullability(table);

  t.equal(tightenedTable, table, 'table is reused when schema is already non-nullable');
  t.equal(tightenedTable.schema?.fields[0].nullable, false, 'loaders.gl schema stays non-nullable');
  t.equal(tightenedTable.data.schema.fields[0].nullable, false, 'Arrow schema stays non-nullable');
  t.end();
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
