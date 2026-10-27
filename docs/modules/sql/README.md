---
title: SQL data sources
description: Query database-backed data sources as rows or Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="SQL module"
  title="Query databases through the source contract."
  description="SQL data sources expose database metadata and query results through the loaders.gl source API. Applications can request ordinary object rows or a typed Arrow table without changing the surrounding data flow."
  tone="yellow"
  meta={['DataSource integration', 'Rows and Arrow', 'Local and service adapters']}
  links={[
    {label: 'SQL APIs', to: '/docs/modules/sql/api-reference/sql-source'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'},
    {label: 'Arrow data plane', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The SQL source boundary"
  title="Discover the database. Submit a query. Return a common table."
  description="The source owns adapter-specific connection and metadata behavior, while application code consumes a small set of query and discovery methods."
  tone="yellow"
  items={[
    {label: 'Adapters', value: 'DuckDB local/wasm and Snowflake SQL API'},
    {label: 'Discover', value: 'Catalogs, schemas, tables, and capabilities'},
    {label: 'Query', value: 'SQL text with adapter-specific options'},
    {label: 'Output', value: 'Object rows or Arrow table data'}
  ]}
/>

<ReferenceBoundary
  title="Source methods"
  description="The reference below covers available adapters, metadata discovery, row queries, Arrow queries, and environment-specific requirements."
  tone="yellow"
/>

SQL data sources provide `createDataSource()` integration for external and embedded databases.

## Sources

- `DuckDBSQLSource` connects to local DuckDB databases in Node.js and DuckDB wasm in the browser.
- `SnowflakeSQLSource` connects to Snowflake through the SQL API.

## Core methods

- `queryRows(sqlText, options)` returns object rows.
- `queryArrow(sqlText, options)` returns a loaders.gl Arrow table.
- `getMetadata()` returns catalogs, schemas, tables, and adapter capabilities.

## DuckDB Arrow interoperability

The browser adapter exchanges Arrow IPC bytes with DuckDB-Wasm. DuckDB retains its
Arrow 17 dependency; loaders.gl decodes query results with Arrow 21. Do not force
DuckDB's Arrow dependency to a different major through package-manager resolutions
or bundler deduplication. IPC results are materialized in memory before decoding.

`DuckDBSQLDataSource.insertArrowTable(table, options)` uploads a loaders.gl Arrow
table by serializing it as an IPC stream. `options.tableName` identifies the
destination, `schemaName` optionally selects a schema, and `create` defaults to
`true`. Set `create: false` to append to an existing table. Uploads currently
require the browser DuckDB-Wasm adapter; the Node adapter reports an unsupported
operation. `insertArrowIPC(bytes, options)` also accepts an already serialized IPC stream.
Custom adapters can implement `insertArrowIPC(bytes, options)`.

```typescript
await source.insertArrowTable(arrowTable, {tableName: 'events'});
await source.insertArrowTable(moreEvents, {tableName: 'events', create: false});
const result = await source.queryArrow('SELECT * FROM events');
```

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/sql/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
