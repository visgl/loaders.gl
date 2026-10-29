SQL module

# Query databases through the source contract.

SQL data sources expose database metadata and query results through the loaders.gl source API. Applications can request ordinary object rows or a typed Arrow table without changing the surrounding data flow.

[SQL APIs](https://loaders.gl/next/docs/modules/sql/api-reference/sql-source.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/sql/api-reference/sql-source.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)[Arrow data plane](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The SQL source boundary

## Discover the database. Submit a query. Return a common table.

The source owns adapter-specific connection and metadata behavior, while application code consumes a small set of query and discovery methods.

01

Adapters

DuckDB local/wasm and Snowflake SQL API

02

Discover

Catalogs, schemas, tables, and capabilities

03

Query

SQL text with adapter-specific options

04

Output

Object rows or Arrow table data

Detailed guide

## Source methods

The reference below covers available adapters, metadata discovery, row queries, Arrow queries, and environment-specific requirements.

SQL data sources provide `createDataSource()` integration for external and embedded databases.

## Sources[​](#sources "Direct link to Sources")

* `DuckDBSQLSource` connects to local DuckDB databases in Node.js and DuckDB wasm in the browser.
* `SnowflakeSQLSource` connects to Snowflake through the SQL API.

## Core methods[​](#core-methods "Direct link to Core methods")

* `queryRows(sqlText, options)` returns object rows.
* `queryArrow(sqlText, options)` returns a loaders.gl Arrow table.
* `getMetadata()` returns catalogs, schemas, tables, and adapter capabilities.

## DuckDB Arrow interoperability[​](#duckdb-arrow-interoperability "Direct link to DuckDB Arrow interoperability")

The browser adapter exchanges Arrow IPC bytes with DuckDB-Wasm. DuckDB retains its Arrow 17 dependency; loaders.gl decodes query results with Arrow 21. Do not force DuckDB's Arrow dependency to a different major through package-manager resolutions or bundler deduplication. IPC results are materialized in memory before decoding.

`DuckDBSQLDataSource.insertArrowTable(table, options)` uploads a loaders.gl Arrow table by serializing it as an IPC stream. `options.tableName` identifies the destination, `schemaName` optionally selects a schema, and `create` defaults to `true`. Set `create: false` to append to an existing table. Uploads currently require the browser DuckDB-Wasm adapter; the Node adapter reports an unsupported operation. `insertArrowIPC(bytes, options)` also accepts an already serialized IPC stream. Custom adapters can implement `insertArrowIPC(bytes, options)`.

```
await source.insertArrowTable(arrowTable, {tableName: 'events'});

await source.insertArrowTable(moreEvents, {tableName: 'events', create: false});

const result = await source.queryArrow('SELECT * FROM events');
```

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/sql/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
