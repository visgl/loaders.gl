---
title: Querying tables
description: Select, filter, and stream Arrow results from loaded tables, URLs, and named data sources.
---

# Querying tables

Use `query()` when you need one Arrow table, or `queryInBatches()` to process Arrow batches as
results arrive. Both execute the same logical query: filter source rows, select and rename columns,
then apply a global limit. Import them from the optional `@loaders.gl/core/scan` entry point.

## Run your first query

A URL requires an explicit **source loader**. This lets the format choose useful reads without
making core depend on format implementations.

```ts
import {query} from '@loaders.gl/core/scan';
import {ParquetSourceLoader} from '@loaders.gl/tables';

const result = await query(
  {
    select: ['name', {column: 'population', as: 'people'}],
    where: {op: '>', args: [{property: 'population'}, 100000]},
    limit: 20
  },
  {source: 'https://example.com/cities.parquet', loaders: ParquetSourceLoader}
);

console.log(result.data.numRows);
console.log(result.data.getChild('people'));
```

The result is a loaders.gl `ArrowTable` wrapper; `result.data` is an Apache Arrow `Table`.
You can also pass an already loaded loaders.gl Arrow table or an existing table scan source as
`source`. Those inputs do not need `loaders`. Parser-only loaders such as `ParquetLoader` are not
source loaders; use `ParquetSourceLoader` for URL queries.

Keep logical operations in the first argument. Put `source`, `loaders`, `signal`, completion
observers, and ordinary request/format options in the second:

```ts
const options = {
  source: 'https://example.com/cities.parquet',
  loaders: ParquetSourceLoader,
  core: {fetch: authenticatedFetch},
  parquet: {batchSize: 1024}
};
```

See [authentication](/docs/developer-guide/authentication) for request credentials.

## Describe the rows and columns

| Query field | Meaning |
| --- | --- |
| `select` | Ordered column names or `{column, as}` aliases. Omit it to select every column. |
| `where` | A predicate over **source column names**, evaluated before aliases. |
| `limit` | Maximum matching rows across the entire execution, including all batches. |
| `from` | Optional registered source name or `{source, table}` reference. |

A predicate column need not appear in `select`. For example, selecting only `name` while filtering
`population` retains `population` internally until filtering is complete. An output alias such as
`people` does not become a WHERE property.

Predicates support comparisons, `and`, `or`, `not`, membership, and null checks. Use
`{op: 'isNull', args: [{property: 'population'}]}` to find nulls. Comparisons with null produce an
unknown result; WHERE retains only true results, so negating a comparison still excludes nulls.
See the [predicate reference](/docs/modules/core/scan) for the full vocabulary.

Rows retain source order. A limit counts matches after filtering; it is not a sample or a sort.
`limit: 0` returns the projected schema without calling the source's result reader, although schema
discovery can still read metadata. Empty results retain field names, types, nullability, and available
metadata. An explicit empty `select` list, unknown columns, duplicate output names, and invalid
limits are errors.

## Stream results

Change the function, not the query:

```ts
import {queryInBatches} from '@loaders.gl/core/scan';

for await (const batch of queryInBatches(
  {select: ['name'], where: {op: '>', args: [{property: 'population'}, 100000]}},
  {source: 'https://example.com/cities.parquet', loaders: ParquetSourceLoader}
)) {
  await consume(batch.data);
}
```

The iterator starts work when consumed and requests input as the consumer advances. `break` closes
the upstream iterator. An empty execution yields one empty schema-bearing batch.

`query()` retains the complete result. Streaming can bound executor working memory by the input
batch size, but batches you retain still occupy memory. Arrow projection and rename reuse column
buffers; slices can retain their original buffers, and scattered filtering can allocate new ones.

## Reuse and name sources

Create a source once when you want repeated queries. Give it an explicit name when it will be
referenced by `from`:

```ts
import {load} from '@loaders.gl/core';

const cities = await load('cities.parquet', ParquetSourceLoader, {
  core: {name: 'cities'}
});

try {
  const result = await query(
    {from: 'cities', select: ['name'], limit: 20},
    {sources: [cities]}
  );
} finally {
  await cities.close();
}
```

`source.name` is fixed at creation. Defaults come from an already available data name or schema
name, then a File/URL basename without its last extension, then an explicit source type or `source`.
Naming does not fetch data. `core.name` overrides the default; it does not rename table columns.
Registered names must be unique; unknown and duplicate names fail explicitly.

Without `from`, the query uses `options.source`. Supplying `sources` alone does not select a default.
With `from`, the selected registered source takes precedence over `options.source`.

### Select a table inside a source

Some sources expose several tables through `getTable(name)`. Keep the outer source name and loaded
table name separate:

```ts
import {GeoPackageSource} from '@loaders.gl/geospatial/geopackage-source-loader';

const warehouse = await load('world.gpkg', GeoPackageSource, {
  core: {name: 'warehouse'}
});

const result = await query(
  {from: {source: 'warehouse', table: 'cities'}, select: ['name']},
  {sources: [warehouse]}
);
```

Only the selected table is resolved. It must return a loaders.gl Arrow table or a source supporting
table metadata and reads. Raster, tile, or catalog sources are not automatically converted into
tables. Names are matched exactly. A string such as `from: 'warehouse.cities'` is one literal source
name; use the structured form for qualified lookup.

## Use SQL through an injected parser

SQL strings use an application-supplied `SQLQueryParser`. Core does not bundle a SQL parser or
execute arbitrary SQL. The adapter translates supported SELECT syntax into the logical query
above and must reject unsupported SQL constructs.

```ts
import type {SQLQueryParser} from '@loaders.gl/core/scan';

// This module belongs to your application and adapts your chosen SQL parser.
const sqlParser: Promise<SQLQueryParser> = import('./app-sql-parser').then(
  module => module.parseQuery
);

const result = await query('SELECT name FROM warehouse.cities LIMIT 20', {
  sources: [warehouse],
  sqlParser
});
```

The parser may be a function or a promise for one, and the function may return its logical query
asynchronously. It is awaited only for SQL string input. A dynamic import starts when you create
its promise; use an async parser function if the import itself should wait until SQL is used. The example's parser returns:

```ts
{from: {source: 'warehouse', table: 'cities'}, select: ['name'], limit: 20}
```

Omitting SQL FROM uses `options.source`. Preserve quoted identifiers as separate components:
`FROM "warehouse.v2"."cities.v3"` maps to `{source: 'warehouse.v2', table: 'cities.v3'}`.
Core validates the returned query and source capabilities before executing it.

## Cancel work and observe completion

Pass an `AbortSignal` to cancel cooperative source discovery and execution. Completion is reported
once per public query, including source-opening failures, cancellation, limits, and consumer return.

```ts
const controller = new AbortController();
const result = await query({select: ['name']}, {
  source: 'https://example.com/cities.parquet',
  loaders: ParquetSourceLoader,
  signal: controller.signal,
  onQueryComplete: summary => console.log(summary.status, summary.rowsReturned)
});
// From a cancellation handler: controller.abort();
```

A throwing observer does not change the result. `rowsRead` describes batches received by the query,
not physical rows skipped by storage pruning; use source telemetry for bytes and row-group metrics.

URL-created sources are closed by the query. Sources supplied as objects, registered in `sources`,
or returned by their `getTable()` remain caller/provider-owned; close their owning source when it
is no longer needed. Iterator cleanup still runs on early return and errors.

## Understand format limits

CSV, NDJSON, Arrow IPC, and Parquet table sources share these semantics, but their physical work
differs. Sequential text/IPC projection happens after decoding. Parquet can skip columns and prune
row groups, then applies exact filtering before the result limit. Streaming does not guarantee
fewer downloaded bytes for every format.

CSV blanks are empty strings, not SQL nulls. NDJSON inference examines its first decoded batch;
provide `ndjson.schema` when that batch cannot determine a field type or when you need precise types.
Changing the output schema, including nullability, during execution is an error. Metadata can only
be preserved when the format supplies it.

These entry points currently support selection, aliases, predicates, and limits. They do not add
joins, sorting, aggregates, SQL expressions in SELECT, or synchronous execution. For exact
signatures, errors, capability details, and benchmark commands, see the
[query API reference](/docs/modules/core/scan/query).
