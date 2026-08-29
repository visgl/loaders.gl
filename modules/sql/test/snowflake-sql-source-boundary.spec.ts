// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {SnowflakeSQLDataSource} from '@loaders.gl/sql';

/** Creates a Snowflake source whose SQL API requests stay entirely in memory. */
function createSource(fetchFunction: typeof fetch, token = 'token'): SnowflakeSQLDataSource {
  return new SnowflakeSQLDataSource('snowflake://account', {
    core: {loadOptions: {core: {fetch: fetchFunction}}},
    snowflake: {token, database: 'database', schema: 'public', warehouse: 'warehouse', role: 'role'}
  });
}

/** Creates one successful Snowflake JSON response. */
function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {'Content-Type': 'application/json'}
  });
}

describe('Snowflake SQL source boundary behavior', () => {
  test('maps catalogs, schemas, tables, columns, and cached metadata', async () => {
    const fetchFunction = vi.fn(async (_url: string, requestInit?: RequestInit) => {
      const statement = JSON.parse(String(requestInit?.body || '{}')).statement || '';
      if (statement === 'SHOW DATABASES') {
        return jsonResponse({resultSetMetaData: {rowType: [{name: 'name'}]}, data: [['catalog']]});
      }
      if (statement === 'SHOW SCHEMAS') {
        return jsonResponse({
          resultSetMetaData: {rowType: [{name: 'database_name'}, {name: 'name'}]},
          data: [['catalog', 'public']]
        });
      }
      if (statement === 'SHOW TABLES') {
        return jsonResponse({
          resultSetMetaData: {
            rowType: [
              {name: 'database_name'},
              {name: 'schema_name'},
              {name: 'name'},
              {name: 'kind'}
            ]
          },
          data: [['catalog', 'public', 'places', 'TABLE']]
        });
      }
      return jsonResponse({
        resultSetMetaData: {
          rowType: [{name: 'name'}, {name: 'type'}, {name: 'null'}]
        },
        data: [
          ['id', 'DOUBLE', 'N'],
          ['label', 'VARCHAR', 'Y']
        ]
      });
    }) as typeof fetch;
    const source = createSource(fetchFunction);

    expect(await source.listCatalogs()).toEqual([{catalogName: 'catalog'}]);
    expect(await source.listSchemas()).toEqual([{catalogName: 'catalog', schemaName: 'public'}]);
    expect(await source.listTables()).toEqual([
      {catalogName: 'catalog', schemaName: 'public', tableName: 'places', tableType: 'TABLE'}
    ]);
    expect(
      (
        await source.getTableSchema({
          catalogName: 'catalog',
          schemaName: 'public',
          tableName: 'places'
        })
      ).fields
    ).toMatchObject([
      {name: 'id', type: 'float64', nullable: false},
      {name: 'label', type: 'utf8', nullable: true}
    ]);

    const firstMetadata = await source.getMetadata();
    const requestCount = fetchFunction.mock.calls.length;
    expect(await source.getMetadata()).toBe(firstMetadata);
    expect(fetchFunction).toHaveBeenCalledTimes(requestCount);
    expect(firstMetadata).toMatchObject({
      type: 'snowflake-sql',
      capabilities: {runtime: 'both', supportsMetadata: true},
      catalogs: [{catalogName: 'catalog'}]
    });
    await source.close();
  });

  test('polls statements and normalizes positional and named bindings', async () => {
    const requests: Array<{url: string; requestInit?: RequestInit}> = [];
    let postCount = 0;
    const fetchFunction = vi.fn(async (url: string, requestInit?: RequestInit) => {
      requests.push({url, requestInit});
      if (requestInit?.method === 'POST') {
        postCount++;
        return jsonResponse({statementStatusUrl: `/status/${postCount}`});
      }
      return jsonResponse({
        resultSetMetaData: {rowType: [{name: 'value'}]},
        data: [[postCount]]
      });
    }) as typeof fetch;
    const source = createSource(fetchFunction, 'Bearer existing');

    expect(await source.queryRows('SELECT ?', {parameters: [1, 2n, 'three']})).toEqual([
      {value: 1}
    ]);
    expect(await source.queryRows('SELECT :value', {parameters: {value: 4}})).toEqual([{value: 2}]);

    const firstBody = JSON.parse(String(requests[0].requestInit?.body));
    expect(firstBody).toMatchObject({
      bindings: {
        '1': {type: 'FIXED', value: 1},
        '2': {type: 'FIXED', value: '2'},
        '3': {type: 'TEXT', value: 'three'}
      },
      database: 'database',
      schema: 'public',
      warehouse: 'warehouse',
      role: 'role'
    });
    expect(requests[0].requestInit?.headers).toSatisfy(
      (headers: Headers) => headers.get('Authorization') === 'Bearer existing'
    );
    expect(requests[1].url).toBe('https://account.snowflakecomputing.com/status/1');
  });

  test('reports token, SQL API, and HTTP failures', async () => {
    await expect(createSource(vi.fn() as typeof fetch, '').queryRows('SELECT 1')).rejects.toThrow(
      'requires snowflake.token'
    );

    const apiErrorSource = createSource(
      vi.fn(async () => jsonResponse({code: 'bad', message: 'statement failed'})) as typeof fetch
    );
    await expect(apiErrorSource.queryRows('INVALID')).rejects.toThrow('statement failed');

    const httpErrorSource = createSource(
      vi.fn(async () => jsonResponse({message: 'unauthorized'}, 401)) as typeof fetch
    );
    await expect(httpErrorSource.queryRows('SELECT 1')).rejects.toThrow('unauthorized');
  });
});
