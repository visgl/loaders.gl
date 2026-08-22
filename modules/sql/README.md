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

## Lightweight Arrow queries

`@loaders.gl/sql/arrow-query` provides an experimental in-memory query path for Arrow tables. It
uses the shared `TableQueryOptions` planner, which always orders operations as scan, filter,
project, then limit. The same immutable plan can be lowered by GPU dataframe implementations
without adopting Arrow's materialization strategy. This is useful for lightweight local filtering;
it is not a replacement for DuckDB and does not yet implement SQL `SELECT` parsing, aggregation,
or joins.

Backends that only need the portable query contract can import `TableQueryOptions` and
`planTableQuery()` from `@loaders.gl/sql/table-query` without importing the Arrow executor.

```ts
import {parseSQLPredicate} from '@loaders.gl/sql/sql-predicate';
import {queryArrowTable} from '@loaders.gl/sql/arrow-query';

const flights = queryArrowTable(arrowTable, {
  predicate: parseSQLPredicate('year >= 2024 AND cancelled = FALSE'),
  columns: ['carrier', 'fare'],
  limit: 100
});
```

Projection and limit-only queries preserve Arrow's zero-copy table views. Predicate queries
currently materialize matching rows while keeping predicate columns out of the result unless
selected explicitly.

Named SQL parameters can remain unresolved while a caller builds or compiles a query. Bind them
immediately before an Arrow backend executes the predicate:

```ts
import {bindSQLPredicate, parseSQLPredicate} from '@loaders.gl/sql/sql-predicate';

const predicate = parseSQLPredicate('fare >= :minimumFare', {preserveParameters: true});
const boundPredicate = bindSQLPredicate(predicate, {minimumFare: 250});
```

## SQL predicate expressions

`parseSQLPredicate()` accepts the expression after `WHERE`, not a complete `SELECT` statement. It
supports comparisons, `IN`, `IS [NOT] NULL`, `AND`, `OR`, `NOT`, parentheses, scalar literals, and
named parameters.

```ts
import {parseSQLPredicate} from '@loaders.gl/sql/sql-predicate';

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

The dependency-free `sql-predicate` subpath does not load or traverse the optional database
adapters. The resulting `op`/`args` representation is directionally aligned with CQL2 JSON but does not
claim CQL2 conformance. `SQL_PREDICATE_JSON_SCHEMA`, `validateSQLPredicate()`, and
`isSQLPredicate()` support dependency-free payload validation.

Applications already using Zod can opt into the separate subpath without adding Zod to the root
bundle:

```ts
import {SQLPredicateSchema} from '@loaders.gl/sql/sql-predicate-zod';

const predicate = SQLPredicateSchema.parse(untrustedPayload);
```
