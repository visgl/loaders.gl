# @loaders.gl/sql

This module contains SQL-oriented `DataSource` implementations for external and embedded databases.

## Included sources

- `DuckDBSQLSource` for embedded DuckDB databases in Node.js and the browser
- `SnowflakeSQLSource` for remote Snowflake SQL API access

## Usage

```ts
import {createDataSource} from '@loaders.gl/core';
import {DuckDBSQLSource} from '@loaders.gl/sql';

const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
  duckdb: {}
});

await dataSource.queryRows('CREATE TABLE numbers AS SELECT 1 AS value');
const rows = await dataSource.queryRows('SELECT * FROM numbers');
```

## Arrow queries

Use `queryArrow()` when the backing adapter supports Arrow-native results, or when you want
loaders.gl to convert row results into an Arrow table.
