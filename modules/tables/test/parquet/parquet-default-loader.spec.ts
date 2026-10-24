// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {encode, parse, load} from '@loaders.gl/core';
import {ParquetLoader, ParquetJSWriter} from '@loaders.gl/tables/parquet/index';
import type {ObjectRowTable} from '@loaders.gl/core/schema';

/** Creates two tiny row groups without storing a binary fixture. */
async function createRowGroups(): Promise<ArrayBuffer> {
  return encode({shape: 'object-row-table', data: [{id: 0}, {id: 1}, {id: 2}, {id: 3}]}, ParquetJSWriter, {
    parquet: {rowGroupSize: 2}
  });
}

test('ParquetLoader selects row groups in caller order before offset and limit', async () => {
  const data = await createRowGroups();
  const table = await parse(data, ParquetLoader, {
    core: {worker: false},
    parquet: {shape: 'object-row-table', rowGroups: [1, 0], offset: 1, limit: 2}
  }) as ObjectRowTable;
  expect(table.data).toEqual([{id: 3}, {id: 0}]);
  await expect(parse(data, ParquetLoader, {
    core: {worker: false}, parquet: {rowGroups: [2]}
  })).rejects.toThrow(/Invalid Parquet row-group index/);
});

test('ParquetLoader preserves an empty row-group selection and cancellation', async () => {
  const data = await createRowGroups();
  const table = await parse(data, ParquetLoader, {
    core: {worker: false}, parquet: {shape: 'object-row-table', rowGroups: []}
  }) as ObjectRowTable;
  expect(table.data).toEqual([]);
  expect(table.schema?.fields.map(field => field.name)).toEqual(['id']);
  const controller = new AbortController();
  controller.abort();
  await expect(parse(data, ParquetLoader, {
    core: {worker: false}, parquet: {signal: controller.signal}
  })).rejects.toMatchObject({name: 'AbortError'});
});

test.each(['nonnullable', 'nullable'])('ParquetLoader decodes legacy %s nested lists to Arrow', async name => {
  const table = await load(`@loaders.gl/tables/parquet/test/data/apache/good/${name}.impala.parquet`, ParquetLoader, {
    core: {worker: false}, parquet: {shape: 'arrow-table'}
  });
  expect(table.shape).toBe('arrow-table');
  if (table.shape === 'arrow-table') {
    expect(table.data.numRows).toBeGreaterThan(0);
    expect(table.data.toArray().length).toBe(table.data.numRows);
    const nested = JSON.parse(JSON.stringify(table.data.getChild(name === 'nonnullable' ? 'nested_Struct' : 'nested_struct')?.get(0)));
    expect(nested[name === 'nonnullable' ? 'B' : 'b']).toEqual(name === 'nonnullable' ? [-1] : [1]);
    if (name === 'nonnullable') {
      expect(nested.G.map).toEqual([]);
    }
  }
});

test('ParquetLoader preserves footer metadata over embedded Arrow metadata and ignores malformed schemas', async () => {
  const embeddedTable = new arrow.Table(new arrow.Schema([
    new arrow.Field('id', new arrow.Int32(), false, new Map([['custom', 'restored']]))
  ], new Map([['source', 'embedded'], ['embeddedOnly', 'restored']])), []);
  const encodedSchema = btoa(String.fromCharCode(...arrow.tableToIPC(embeddedTable)));
  for (const arrowSchema of [encodedSchema, '%invalid-base64%']) {
    const data = await encode({shape: 'object-row-table', data: [{id: 1}], schema: {
      fields: [{name: 'id', type: 'int32', nullable: false}],
      metadata: {source: 'footer', 'ARROW:schema': arrowSchema}
    }}, ParquetJSWriter);
    const table = await parse(data, ParquetLoader, {
      core: {worker: false}, parquet: {shape: 'object-row-table'}
    }) as ObjectRowTable;
    expect(table.data).toEqual([{id: 1}]);
    expect(table.schema?.metadata?.source).toBe('footer');
    if (arrowSchema === encodedSchema) {
      expect(table.schema?.metadata?.embeddedOnly).toBe('restored');
      expect(table.schema?.fields[0].metadata?.custom).toBe('restored');
    }
  }
});
