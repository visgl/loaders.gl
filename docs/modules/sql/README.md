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
