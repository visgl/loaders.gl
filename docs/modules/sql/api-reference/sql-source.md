# SQLDataSource

`SQLDataSource` is a shared base class for SQL-backed data sources such as `DuckDBSQLSource` and `SnowflakeSQLSource`.

## Methods

### `getMetadata()`

Returns cached source metadata including catalogs, schemas, tables, and adapter capabilities.

### `listCatalogs()`

Returns normalized catalog metadata from the current SQL source.

### `listSchemas(catalogName?)`

Returns normalized schema metadata, optionally scoped to a catalog.

### `listTables({catalogName?, schemaName?})`

Returns normalized table metadata, optionally scoped to a catalog or schema.

### `getTableSchema({catalogName?, schemaName?, tableName})`

Returns a loaders.gl schema for a single table.

### `queryRows(sqlText, options?)`

Executes SQL and returns object rows.

### `queryArrow(sqlText, options?)`

Executes SQL and returns a loaders.gl Arrow table.

### `close()`

Closes the backing adapter connection and clears cached metadata.
