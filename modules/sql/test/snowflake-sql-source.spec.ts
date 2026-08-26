// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource} from '@loaders.gl/core';
import {SnowflakeSQLDataSource, SnowflakeSQLSource} from '@loaders.gl/sql';
test('SnowflakeSQLSource#createDataSource selects Snowflake source from URL', () => {
  const dataSource = createDataSource('sql+snowflake://example-account', [SnowflakeSQLSource], {
    snowflake: {token: 'token'}
  });
  expect(
    dataSource instanceof SnowflakeSQLDataSource,
    'returns SnowflakeSQLDataSource'
  ).toBeTruthy();
});
test('SnowflakeSQLSource executes SQL API queries through fetch', async () => {
  const fetchResponse = async (_url: string, requestInit?: RequestInit) => {
    if (requestInit?.method === 'POST') {
      return new Response(
        JSON.stringify({
          resultSetMetaData: {
            rowType: [{name: 'name'}, {name: 'count'}],
            partitionInfo: [{}, {}]
          },
          statementHandle: 'statement-1',
          data: [['demo', 2]]
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json'}
        }
      );
    }
    return new Response(
      JSON.stringify({
        data: [['extra', 4]]
      }),
      {
        status: 200,
        headers: {'Content-Type': 'application/json'}
      }
    );
  };
  const dataSource = createDataSource('sql+snowflake://example-account', [SnowflakeSQLSource], {
    core: {
      loadOptions: {
        core: {
          fetch: fetchResponse
        }
      }
    },
    snowflake: {token: 'token'}
  }) as SnowflakeSQLDataSource;
  const rows = await dataSource.queryRows('SELECT * FROM demo');
  expect(rows, 'returns SQL API rows across partitions').toEqual([
    {name: 'demo', count: 2},
    {name: 'extra', count: 4}
  ]);
  const arrowTable = await dataSource.queryArrow('SELECT * FROM demo');
  expect(arrowTable.data.numRows, 'returns Arrow table fallback across partitions').toBe(2);
  expect(arrowTable.data.get(0)?.toJSON()?.name, 'maps response rows to Arrow output').toBe('demo');
  expect(arrowTable.data.get(1)?.toJSON()?.name, 'includes partition rows in Arrow output').toBe(
    'extra'
  );
});
