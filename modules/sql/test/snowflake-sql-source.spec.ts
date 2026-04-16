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
  t.deepEqual(
    rows,
    [
      {name: 'demo', count: 2},
      {name: 'extra', count: 4}
    ],
    'returns SQL API rows across partitions'
  );

  const arrowTable = await dataSource.queryArrow('SELECT * FROM demo');
  t.equal(arrowTable.data.numRows, 2, 'returns Arrow table fallback across partitions');
  t.equal(arrowTable.data.get(0)?.toJSON()?.name, 'demo', 'maps response rows to Arrow output');
  t.equal(
    arrowTable.data.get(1)?.toJSON()?.name,
    'extra',
    'includes partition rows in Arrow output'
  );

  t.end();
});
