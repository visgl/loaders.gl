// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {createScanEngine, parseSQLPredicate, registerScanBackend} from '@loaders.gl/scan';

test('creates the Arrow reference engine by default', async () => {
  const engine = await createScanEngine();
  const result = engine.query(makeArrowTable({name: ['a', 'b'], value: [1, 2]}), {
    predicate: parseSQLPredicate('value >= 2'),
    columns: ['name'],
    limit: 1
  });

  expect(engine.name).toBe('arrow');
  expect(result.data.schema.fields.map(field => field.name)).toEqual(['name']);
  expect(result.data.toArray().map(row => row?.toJSON())).toEqual([{name: 'b'}]);
});

test('loads a registered backend through the same root API', async () => {
  registerScanBackend('test', async () => ({
    name: 'test',
    query: sourceTable => sourceTable,
    explain: () => ({}) as never
  }));

  const engine = await createScanEngine({backend: 'test'});
  const table = makeArrowTable({value: [1]});

  expect(engine.name).toBe('test');
  expect(engine.query(table)).toBe(table);
});

test('reports unavailable backends clearly', async () => {
  await expect(createScanEngine({backend: 'duckdb'})).rejects.toThrow(
    'Scan backend "duckdb" is not registered'
  );
});

/** Wraps simple test columns in the loaders.gl Arrow table shape. */
function makeArrowTable(columns: Record<string, readonly unknown[]>): ArrowTable {
  const data = arrow.tableFromArrays(columns);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}
