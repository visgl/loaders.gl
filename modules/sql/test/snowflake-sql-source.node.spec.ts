import test from 'tape-promise/tape';
import {createDataSource} from '@loaders.gl/core';
import {SnowflakeSQLDataSource, SnowflakeSQLSource} from '@loaders.gl/sql';

test('SnowflakeSQLSource#createDataSource selects Snowflake source from URL', t => {
  const dataSource = createDataSource('sql+snowflake://example-account', [SnowflakeSQLSource], {
    snowflake: {token: 'token'}
  });

  t.ok(dataSource instanceof SnowflakeSQLDataSource, 'returns SnowflakeSQLDataSource');
  t.end();
});

test('SnowflakeSQLSource executes SQL API queries through fetch', async t => {
  const dataSource = createDataSource('sql+snowflake://example-account', [SnowflakeSQLSource], {
    core: {
      loadOptions: {
        core: {
          fetch: async (_url: string, _requestInit?: RequestInit) =>
            new Response(
              JSON.stringify({
                resultSetMetaData: {
                  rowType: [{name: 'name'}, {name: 'count'}],
                  partitionInfo: [{}]
                },
                data: [['demo', 2]]
              }),
              {
                status: 200,
                headers: {'Content-Type': 'application/json'}
              }
            )
        }
      }
    },
    snowflake: {token: 'token'}
  }) as SnowflakeSQLDataSource;

  const rows = await dataSource.queryRows('SELECT * FROM demo');
  t.deepEqual(rows, [{name: 'demo', count: 2}], 'returns SQL API rows');

  const arrowTable = await dataSource.queryArrow('SELECT * FROM demo');
  t.equal(arrowTable.data.numRows, 1, 'returns Arrow table fallback');
  t.equal(arrowTable.data.get(0)?.toJSON()?.name, 'demo', 'maps response rows to Arrow output');

  t.end();
});
