// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {DuckDBSQLDataSource} from '@loaders.gl/sql';

// Real WASM startup and the large engine asset belong in the hermetic slow lane.
test('DuckDB exchanges IPC with Arrow 21 for queries and uploads', async () => {
  const assetRoot = `${location.origin}/__loaders_gl_test_fixtures__/node_modules/@duckdb/duckdb-wasm/dist/`;
  const source = new DuckDBSQLDataSource('duckdb:///:memory:', {
    duckdb: {
      bundles: {mainModule: `${assetRoot}duckdb-eh.wasm`},
      workerUrl: `${assetRoot}duckdb-browser-eh.worker.js`
    }
  });
  try {
    const result = await source.queryArrow(`SELECT
      9007199254740993::BIGINT AS large_integer,
      NULL::INTEGER AS missing,
      TIMESTAMP '2020-01-01 00:00:00' AS instant,
      '\\x01\\x02'::BLOB AS bytes,
      [1, 2] AS nested`);
    expect(result.data).toBeInstanceOf(arrow.Table);
    expect(result.data.getChild('large_integer')?.get(0)).toBe(9007199254740993n);
    expect(result.data.getChild('missing')?.get(0)).toBeNull();
    expect(result.data.getChild('instant')?.get(0)).toBe(Date.UTC(2020, 0, 1));
    expect(Array.from(result.data.getChild('bytes')!.get(0))).toEqual([1, 2]);
    expect(Array.from(result.data.getChild('nested')!.get(0))).toEqual([1, 2]);
    const empty = await source.queryArrow('SELECT 1::INTEGER AS value WHERE false');
    expect(empty.data.numRows).toBe(0);
    expect(empty.data.schema.fields[0].name).toBe('value');
    await source.insertArrowTable(result, {tableName: 'uploaded'});
    await source.insertArrowTable(result, {tableName: 'uploaded', create: false});
    const uploaded = await source.queryArrow('SELECT * FROM uploaded WHERE large_integer = ?', {
      parameters: ['9007199254740993']
    });
    expect(uploaded.data).toBeInstanceOf(arrow.Table);
    expect(uploaded.data.numRows).toBe(2);
    expect(uploaded.data.schema.fields.map(field => field.name)).toEqual(
      result.data.schema.fields.map(field => field.name)
    );
    expect(uploaded.data.getChild('large_integer')?.get(1)).toBe(9007199254740993n);
    await expect(
      source.queryArrow('SELECT * FROM absent_table WHERE value = ?', {
        parameters: [1]
      })
    ).rejects.toThrow();
    expect(await source.queryRows('SELECT 1 AS value')).toEqual([{value: 1}]);
  } finally {
    await source.close();
  }
}, 30000);
