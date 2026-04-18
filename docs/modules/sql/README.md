# SQL

SQL data sources provide `createDataSource()` integration for external and embedded databases.

## Sources

- `DuckDBSQLSource` connects to local DuckDB databases in Node.js and DuckDB wasm in the browser.
- `SnowflakeSQLSource` connects to Snowflake through the SQL API.

## Core methods

- `queryRows(sqlText, options)` returns object rows.
- `queryArrow(sqlText, options)` returns a loaders.gl Arrow table.
- `getMetadata()` returns catalogs, schemas, tables, and adapter capabilities.
