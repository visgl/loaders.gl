---
title: SQLDataSource
description: A shared source contract for metadata, portable table queries, and Arrow results.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="SQL module · source API"
  title="SQLDataSource"
  description="A shared base class for SQL-backed sources that exposes catalog metadata, table schemas, portable queries, and Arrow results through one application-facing contract."
  tone="mint"
  meta={['Metadata discovery', 'Portable predicates', 'Arrow queries']}
  links={[
    {label: 'SQL module', to: '/docs/modules/sql'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Arrow guide', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The SQL source boundary"
  title="Discover once. Query through a common shape."
  description="SQLDataSource keeps provider-specific adapters behind a small set of metadata and query methods. Applications can work with tables and Arrow results without knowing which backend is connected."
  tone="mint"
  items={[
    {label: 'Metadata', value: 'Catalogs, schemas, tables, and capabilities'},
    {label: 'Schema', value: 'A loaders.gl schema for each table'},
    {label: 'Rows', value: 'Object rows for straightforward application use'},
    {label: 'Arrow', value: 'Columnar results for analytical pipelines'}
  ]}
/>

<ReferenceBoundary
  title="SQLDataSource reference"
  description="The sections below document metadata methods, portable queries, raw SQL, Arrow results, and connection cleanup."
  tone="mint"
/>

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
