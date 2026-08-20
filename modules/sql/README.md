# @loaders.gl/sql

This module contains SQL-oriented `DataSource` implementations for external and embedded databases.
It also provides a dependency-free parser for turning a small SQL `WHERE` expression into a
portable predicate AST.

## Included sources

- `DuckDBSQLSource` for embedded DuckDB databases in Node.js and the browser
- `SnowflakeSQLSource` for remote Snowflake SQL API access

## Usage

Install the DuckDB runtime needed by your application in addition to `@loaders.gl/sql`:

```bash
yarn add @duckdb/node-api
# or, for browsers
yarn add @duckdb/duckdb-wasm
```

Both DuckDB packages are optional peers and are dynamically imported only when a DuckDB source
connects. Importing the SQL predicate parser does not load or install either runtime.

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

## SQL predicate expressions

`parseSQLPredicate()` accepts the expression after `WHERE`, not a complete `SELECT` statement. It
supports comparisons, `IN`, `IS [NOT] NULL`, `AND`, `OR`, `NOT`, parentheses, scalar literals, and
named parameters.

```ts
import {parseSQLPredicate} from '@loaders.gl/sql';

const predicate = parseSQLPredicate(
  "timestamp >= :start AND status IN ('valid', 'estimated')",
  {parameters: {start: new Date('2026-01-01T00:00:00Z')}}
);

for await (const batch of parquetSource.read({
  columns: ['timestamp', 'value'],
  predicate
})) {
  // SQLPredicate is structurally compatible with the experimental Parquet predicate subset.
}
```

The resulting `op`/`args` representation is directionally aligned with CQL2 JSON but does not
claim CQL2 conformance. `SQL_PREDICATE_JSON_SCHEMA`, `validateSQLPredicate()`, and
`isSQLPredicate()` support dependency-free payload validation.

Applications already using Zod can opt into the separate subpath without adding Zod to the root
bundle:

```ts
import {SQLPredicateSchema} from '@loaders.gl/sql/sql-predicate-zod';

const predicate = SQLPredicateSchema.parse(untrustedPayload);
```
