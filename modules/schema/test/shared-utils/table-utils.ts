// loaders.gl, MIT license
// Attribution: Copyright 2023 Foursquare Labs, Inc.

import {Table, Schema, Field} from '@loaders.gl/schema';

export type TableTestCase = {
  name: string;
  options?: Record<string, unknown>;
  input: Table;
  expected: any;
};

export type TestTableColumn = [field: Field, data: ArrayLike<any>];

/** This util is imported by writer tests in other modules */
export function makeTestTable(columns: TestTableColumn[]): Table {
  const table: Table = {
    shape: 'columnar-table',
    schema: {fields: [], metadata: {}},
    data: {}
  };

  for (const [field, data] of columns) {
    table.schema?.fields.push(field);
    table.data[field.name] = data;
  }

  return table;
}

export function makeTestTableFromSchemaAndColumns(options: {
  schema: Schema;
  columns: ArrayLike<any>;
}) {
  const table: Table = {
    shape: 'columnar-table',
    schema: {fields: [], metadata: {}},
    data: {}
  };

  return table;
}
