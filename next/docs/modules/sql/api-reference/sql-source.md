SQL module · source API

# SQLDataSource

A shared base class for SQL-backed sources that exposes catalog metadata, table schemas, portable queries, and Arrow results through one application-facing contract.

[SQL module](https://loaders.gl/next/docs/modules/sql.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/sql.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Arrow guide](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The SQL source boundary

## Discover once. Query through a common shape.

SQLDataSource keeps provider-specific adapters behind a small set of metadata and query methods. Applications can work with tables and Arrow results without knowing which backend is connected.

01

Metadata

Catalogs, schemas, tables, and capabilities

02

Schema

A loaders.gl schema for each table

03

Rows

Object rows for straightforward application use

04

Arrow

Columnar results for analytical pipelines

Detailed guide

## SQLDataSource reference

The sections below document metadata methods, portable queries, raw SQL, Arrow results, and connection cleanup.

`SQLDataSource` is a shared base class for SQL-backed data sources such as `DuckDBSQLSource` and `SnowflakeSQLSource`.

## Methods[​](#methods "Direct link to Methods")

### `getMetadata()`[​](#getmetadata "Direct link to getmetadata")

Returns cached source metadata including catalogs, schemas, tables, and adapter capabilities.

### `listCatalogs()`[​](#listcatalogs "Direct link to listcatalogs")

Returns normalized catalog metadata from the current SQL source.

### `listSchemas(catalogName?)`[​](#listschemascatalogname "Direct link to listschemascatalogname")

Returns normalized schema metadata, optionally scoped to a catalog.

### `listTables({catalogName?, schemaName?})`[​](#listtablescatalogname-schemaname "Direct link to listtablescatalogname-schemaname")

Returns normalized table metadata, optionally scoped to a catalog or schema.

### `getTableSchema({catalogName?, schemaName?, tableName})`[​](#gettableschemacatalogname-schemaname-tablename "Direct link to gettableschemacatalogname-schemaname-tablename")

Returns a loaders.gl schema for a single table.

### `queryRows(query, options?)`[​](#queryrowsquery-options "Direct link to queryrowsquery-options")

Executes raw SQL or a portable table query and returns object rows.

```
const rows = await source.queryRows(

  {

    tableName: 'flights',

    columns: ['carrier', 'fare'],

    predicate: parseSQLPredicate('year >= :minimumYear', {preserveParameters: true}),

    limit: 100

  },

  {parameters: {minimumYear: 2024}}

);
```

Portable table queries are compiled to quoted, parameterized SQL inside the data source. Raw SQL remains available for operations outside the portable scan subset.

### `queryArrow(query, options?)`[​](#queryarrowquery-options "Direct link to queryarrowquery-options")

Executes raw SQL or a portable table query and returns a loaders.gl Arrow table.

### `close()`[​](#close "Direct link to close")

Closes the backing adapter connection and clears cached metadata.

## DuckDB Arrow uploads[​](#duckdb-arrow-uploads "Direct link to DuckDB Arrow uploads")

These methods are available on `DuckDBSQLDataSource` with the browser DuckDB-Wasm adapter. The Node adapter rejects uploads as unsupported. Custom SQL adapters can provide the optional `insertArrowIPC` method to support uploads.

### `insertArrowTable(table, options)`[​](#insertarrowtabletable-options "Direct link to insertarrowtabletable-options")

Serializes a loaders.gl `ArrowTable` with the application's Arrow runtime, then uploads the IPC stream to DuckDB. No Arrow runtime objects cross the adapter boundary.

### `insertArrowIPC(bytes, options)`[​](#insertarrowipcbytes-options "Direct link to insertarrowipcbytes-options")

Uploads a complete Arrow IPC stream supplied as a `Uint8Array`. This avoids serializing a table when the caller already has IPC bytes. The browser adapter copies the bytes before transferring them to its worker, so the caller can reuse the input.

Both methods return `Promise<void>` and accept `SQLArrowInsertOptions`:

| Option       | Meaning                                                                           |
| ------------ | --------------------------------------------------------------------------------- |
| `tableName`  | Required destination table name.                                                  |
| `schemaName` | Optional destination schema.                                                      |
| `create`     | Defaults to `true` to create a table; use `false` to append to an existing table. |

Query results cross the same IPC boundary in the opposite direction and are decoded with loaders.gl's Arrow runtime. DuckDB-Wasm keeps its own Arrow 17 dependency; loaders.gl uses Arrow 21. Complete query results and upload streams are materialized in memory; these methods do not provide incremental streaming or zero-copy transfer.
