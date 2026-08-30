// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import type {ArrowTable} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import {
  createScanEngine,
  createScanQueryMetadata,
  parseSQLPredicate,
  registerScanBackend
} from '@loaders.gl/scan';

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

  const asyncResult = await engine.queryAsync(makeArrowTable({value: [1, 2]}), {limit: 1});
  expect(asyncResult.data.numRows).toBe(1);
});

test('exposes the shared metadata vocabulary from the optional scan package', () => {
  const table = makeArrowTable({name: ['a'], value: [1]});
  const metadata = createScanQueryMetadata({
    sourceType: 'test',
    queryType: 'table',
    execution: {status: 'supported', method: 'read'},
    schema: table.schema,
    capabilities: {
      table: {
        predicate: 'residual',
        projection: 'pushdown',
        limit: 'pushdown',
        streaming: true,
        cancellation: true
      }
    }
  });

  expect(metadata.columns.map(column => column.name)).toEqual(['name', 'value']);
  expect(Object.isFrozen(metadata)).toBe(true);
});

test('loads a registered backend through the same root API', async () => {
  const asynchronousTable = makeArrowTable({value: [2]});
  registerScanBackend('test', async () => ({
    name: 'test',
    query: sourceTable => sourceTable,
    queryAsync: async () => asynchronousTable,
    explain: () => ({}) as never
  }));

  const engine = await createScanEngine({backend: 'test'});
  const table = makeArrowTable({value: [1]});

  expect(engine.name).toBe('test');
  expect(engine.query(table)).toBe(table);
  await expect(engine.queryAsync(table)).resolves.toBe(asynchronousTable);
});

test('preserves prototype methods and receiver when loading class backends', async () => {
  class ClassBackend {
    readonly name = 'class-backend' as const;
    readonly prefix = 'class';
    query(sourceTable: ArrowTable) {
      if (this.prefix !== 'class') throw new Error('backend receiver was lost');
      return sourceTable;
    }
    explain() {
      return {} as never;
    }
  }
  registerScanBackend('class-backend', () => new ClassBackend());
  const engine = await createScanEngine({backend: 'class-backend'});
  const table = makeArrowTable({value: [1]});
  expect(engine.query(table)).toBe(table);
  await expect(engine.queryAsync(table)).resolves.toBe(table);
});

test('validates backend registrations and loader names', async () => {
  expect(() => registerScanBackend('' as never, () => ({}) as never)).toThrow(
    'A scan backend name and loader are required'
  );
  expect(() => registerScanBackend('invalid-loader', undefined as never)).toThrow(
    'A scan backend name and loader are required'
  );

  registerScanBackend('mismatch', () => ({
    name: 'different',
    query: sourceTable => sourceTable,
    explain: () => ({}) as never
  }));
  await expect(createScanEngine({backend: 'mismatch'})).rejects.toThrow(
    'returned "different" while "mismatch" was requested'
  );
});

test('explains Arrow queries through the same engine', async () => {
  const engine = await createScanEngine({backend: 'arrow'});
  const explanation = engine.explain(makeArrowTable({value: [1]}), {
    predicate: parseSQLPredicate('value >= 1'),
    columns: ['value'],
    limit: 1
  });

  expect(explanation.plan.map(step => step.kind)).toEqual(['scan', 'filter', 'project', 'limit']);
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
