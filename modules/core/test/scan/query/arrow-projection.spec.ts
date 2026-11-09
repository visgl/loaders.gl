// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {projectArrowTable, convertArrowToSchema} from '@loaders.gl/core/schema-utils';
import {queryArrowTable, explainArrowTableQuery} from '../../../src/scan/query-arrow-table';

/** Small fixture with validity, offsets, dictionaries, and nested children. */
function makeTable(): arrow.Table {
  const data = new arrow.Table({
    number: arrow.vectorFromArray([1, null, 3], new arrow.Int32()),
    text: arrow.vectorFromArray(['one', null, 'three'], new arrow.Utf8()),
    dictionary: arrow.vectorFromArray(
      ['a', 'b', 'a'],
      new arrow.Dictionary(new arrow.Utf8(), new arrow.Int32())
    ),
    nested: arrow.vectorFromArray(
      [{value: 1}, null, {value: 3}],
      new arrow.Struct([new arrow.Field('value', new arrow.Int32(), true)])
    ),
    list: arrow.vectorFromArray(
      [[1, 2], null, [3]],
      new arrow.List(new arrow.Field('item', new arrow.Int32(), true))
    )
  });
  const fields = data.schema.fields.map(field =>
    field.clone({
      metadata: new Map([['ARROW:extension:name', `test.${field.name}`]])
    })
  );
  const schema = new arrow.Schema(fields, new Map([['source', 'fixture']]));
  return new arrow.Table(
    schema,
    data.batches.map(
      batch => new arrow.RecordBatch(schema, batch.data, new Map([['batch', 'fixture']]))
    )
  );
}

test('projection reuses complete column data trees while preserving metadata and batch order', () => {
  const original = makeTable();
  const source = original.concat(original).slice(1, 5);
  const selections = ['list', 'dictionary', 'text', 'number', 'nested'].map(column => ({
    column,
    as: `renamed_${column}`
  }));
  const result = projectArrowTable(source, selections);
  expect(result.numRows).toBe(4);
  expect(result.batches.map(batch => batch.numRows)).toEqual(
    source.batches.map(batch => batch.numRows)
  );
  expect(result.schema.metadata).toEqual(source.schema.metadata);
  for (let index = 0; index < selections.length; index++) {
    const sourceIndex = source.schema.fields.findIndex(
      field => field.name === selections[index].column
    );
    const field = result.schema.fields[index];
    expect(field.name).toBe(selections[index].as);
    expect(field.type).toBe(source.schema.fields[sourceIndex].type);
    expect(field.nullable).toBe(source.schema.fields[sourceIndex].nullable);
    expect(field.metadata).toEqual(source.schema.fields[sourceIndex].metadata);
    result.batches.forEach((batch, batchIndex) => {
      const sourceBatch = source.batches[batchIndex];
      // Identity covers value, offset, validity, nested child, and dictionary buffers.
      expect(batch.data.children[index]).toBe(sourceBatch.data.children[sourceIndex]);
      expect(batch.metadata).toEqual(sourceBatch.metadata);
    });
  }
  expect(original.schema.fields[0].name).toBe('number');
});

test('repeated aliases share data and empty projections preserve row counts', () => {
  const source = makeTable();
  const result = projectArrowTable(source, [
    {column: 'number', as: 'a'},
    {column: 'number', as: 'b'}
  ]);
  expect(result.batches[0].data.children[0]).toBe(result.batches[0].data.children[1]);
  expect(projectArrowTable(source, []).numRows).toBe(source.numRows);
  const empty = projectArrowTable(source.slice(0, 0), [{column: 'text', as: 'label'}]);
  expect(empty.numRows).toBe(0);
  expect(empty.schema.fields[0].metadata).toEqual(source.schema.fields[1].metadata);
  expect(empty.schema.fields[0].name).toBe('label');
});

test('queryArrowTable resolves predicates before applying aliases and limits zero-copy views', () => {
  const data = makeTable();
  const table = {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
  const selected = queryArrowTable(table, {select: [{column: 'text', as: 'label'}], limit: 2});
  expect(selected.data.numRows).toBe(2);
  expect(selected.data.getChild('label')!.data[0].values.buffer).toBe(
    data.getChild('text')!.data[0].values.buffer
  );
  const explanation = explainArrowTableQuery(table, {select: [{column: 'text', as: 'label'}]});
  expect(explanation.outputColumns).toEqual(['label']);
  expect(explanation.requiredColumns).toEqual(['text']);
  const filtered = queryArrowTable(table, {
    select: [{column: 'text', as: 'number'}],
    predicate: {op: '>', args: [{property: 'number'}, 1]}
  });
  expect(filtered.data.toArray().map(row => row.toJSON())).toEqual([{number: 'three'}]);
  expect(() => queryArrowTable(table, {select: ['text'], columns: ['text']})).toThrow(
    /cannot be combined/
  );
  expect(() => projectArrowTable(data, ['missing'])).toThrow(/not found/);
  expect(() => projectArrowTable(data, ['text', 'text'])).toThrow(/duplicate/);
});

test('existing empty source field names remain valid in unchanged projections', () => {
  const data = new arrow.Table({'': arrow.vectorFromArray([1, 2, 3], new arrow.Int32())});
  const source = {shape: 'arrow-table' as const, data, schema: convertArrowToSchema(data.schema)};
  const projected = projectArrowTable(data, ['']);
  expect(projected.getChild('')!.toArray()).toEqual(data.getChild('')!.toArray());
  expect(projected.batches[0].data.children[0]).toBe(data.batches[0].data.children[0]);
  expect(queryArrowTable(source).data.numRows).toBe(3);
  expect(queryArrowTable(source, {columns: ['']}).data.schema.fields[0].name).toBe('');
  expect(projectArrowTable(data, [{column: ''}]).schema.fields[0].name).toBe('');
  expect(() => projectArrowTable(data, [{column: '', as: ''}])).toThrow(/Invalid/);
});
