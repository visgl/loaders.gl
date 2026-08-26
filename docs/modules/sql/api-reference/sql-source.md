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

### `queryRows(query, options?)`

Executes raw SQL or a portable table query and returns object rows.

```ts
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

Portable table queries are compiled to quoted, parameterized SQL inside the data source. Raw SQL
remains available for operations outside the portable scan subset.

### `queryArrow(query, options?)`

Executes raw SQL or a portable table query and returns a loaders.gl Arrow table.

### `close()`

Closes the backing adapter connection and clears cached metadata.
