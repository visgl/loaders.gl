---
title: '@loaders.gl/core/query'
description: A portable query runtime for bounded, selective reads across local and cloud data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {CrossFormatScanEngineGraphic} from '@site/src/components/docs/cross-format-scan-engine-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Module overview"
  title="@loaders.gl/core/query"
  description="Describe the rows, columns, bounds, and limits you need once, then let each source plan the most useful reads it can perform."
  tone="violet"
  meta={['Arrow results', 'Range-aware sources', 'Portable query contract']}
  links={[
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Querying tables', to: '/docs/developer-guide/querying-tables'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

<CrossFormatScanEngineGraphic />

<DocOrientation
  eyebrow="The scan module"
  title="Describe the work. Let the source plan the reads."
  description="The scan runtime keeps query intent separate from the storage format, so an application can ask for columns, predicates, bounds, and limits while each source reports what it can execute."
  tone="violet"
  items={[
    {label: 'Intent', value: 'Columns, predicates, bounds, limits, and ordering'},
    {label: 'Planning', value: 'Source metadata distinguishes pushdown from residual work'},
    {label: 'Execution', value: 'Arrow tables, addressed tiles, or bounded feature requests'},
    {label: 'Federation', value: 'Ordered append with schema reconciliation and provenance'}
  ]}
/>

`@loaders.gl/core/query` is the optional application-facing runtime for portable queries. It collects the
reference Arrow executor, query parsing, source-neutral query metadata, ordered append federation,
and adapters that expose an already-addressed vector result as a table.

For application table queries, start with [Querying tables](/docs/developer-guide/querying-tables)
and the [query API reference](/docs/modules/core/scan/query).

Format packages do not depend on this runtime. They implement lightweight contracts from
`@loaders.gl/core/loader-utils`, so applications that only load or decode a format do not pay the scan
runtime bundle cost.

## Table-format sources

Iceberg, Delta Lake, and Hudi sources live under `@loaders.gl/tables/iceberg`, `/delta`, and `/hudi`.
The scan runtime
does not depend on table-format implementations. See the
[Parquet module](/docs/modules/tables/parquet) and the
[common scan architecture](/docs/developer-guide/common-scan-architecture) for source APIs.

<ReferenceBoundary
  title="Scan APIs and execution semantics"
  description="The reference below covers installation, table execution, source metadata, federation, vector views, cancellation, and backend registration."
  tone="violet"
/>

## Installation

```bash
npm install @loaders.gl/core apache-arrow
```

## Query an Arrow table

Scan backends accept and return Apache Arrow `Table` objects. Arrow is the built-in
reference backend. `createScanEngine()` is asynchronous so an application can
register another backend lazily without changing its calling code.

```ts
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/core/query';

const engine = await createScanEngine();
const result = engine.query(table, {
  predicate: parseSQLPredicate("status = 'active'"),
  columns: ['id', 'status'],
  limit: 100
});
```

For backends that schedule asynchronous or compiled work, use the experimental `queryAsync()`
path. The built-in Arrow backend supports it, and synchronous custom backends receive an automatic
compatibility wrapper:

```ts
const result = await engine.queryAsync(table, {
  predicate: parseSQLPredicate("status = 'active'"),
  limit: 100
});
```

This remains an Arrow-in/Arrow-out boundary. GPU graph compilation and GPU-resident result
ownership are backend-specific and are not implied by `queryAsync()`.

The query is immutable and follows `filter -> project -> limit` semantics. Predicate columns do not
need to appear in the result projection, and a limit counts only rows that survive filtering.

## Run Arrow queries in a worker

Use `queryArrowTableInWorker(table, options, {worker})` for a single query. To send a source table
once and run multiple queries, open a session with `createArrowQueryWorker()`. Both APIs accept the
same query options as `queryArrowTable()`, including parsed SQL predicates.

```ts
import {createArrowQueryWorker, parseSQLPredicate} from '@loaders.gl/core/scan';

const session = await createArrowQueryWorker(table, {
  worker: {
    url: new URL(import.meta.resolve('@loaders.gl/core/scan/arrow-query-worker-entry.js'))
  }
});
try {
  const result = await session.query({
    predicate: parseSQLPredicate("status = 'active'"),
    columns: ['id']
  });
  const source = await session.takeTable();
} finally {
  await session.close();
}
```

The example uses Node's module resolution. In a browser build, supply a `worker.create` factory
returning a fresh module worker. Point it to a local worker module that imports
`@loaders.gl/core/scan/arrow-query-worker-entry.js`.

The default copies the input buffers. Set `inputOwnership: 'transfer'` to move them and relinquish
every source alias, including slices and shared dictionary buffers. `getTable()` returns a copy of
the source and keeps the session open. `takeTable()` transfers the source buffers back and closes the
session. Query results have independent buffers, so a projection or slice cannot detach the worker's
source table. Each session processes requests in order.

## Discover source controls

Scan-aware sources expose metadata before execution. This is the contract used by the shared
documentation query panel.

```ts
const metadata = await source.getQueryMetadata();

console.log(metadata.execution); // supported method, or a concrete unsupported reason
console.log(metadata.columns); // fields available to projection and predicates
console.log(metadata.capabilities); // pushdown, residual, or unsupported operators
```

Applications should use `metadata.execution`, not the existence of a method with a familiar name,
to decide whether Apply is enabled. Capability metadata distinguishes correct residual execution
from physical pushdown.

## Runtime surfaces

| API | Use it for | Result |
| --- | --- | --- |
| `createScanEngine()` | Query one in-memory Arrow table | Materialized Arrow table |
| `registerScanBackend()` | Register an application-owned lazy backend | No eager backend import |
| `FederatedTableScanSource` | Append managed table sources in stable order | Arrow batches with provenance |
| `VectorTileTableScanSource` | Query one already-addressed MVT or vector PMTiles tile | One Arrow feature batch |
| `VectorFeatureTableScanSource` | Query one bounded WFS, OGC API Features, or ArcGIS feature request | One Arrow feature batch |
| Query and metadata types | Build source-neutral controls | Serializable query state |

## Ordered append federation

`FederatedTableScanSource` resolves child sources through the existing `DataSourceManager`. It is an
ordered `UNION ALL`, not a distributed database.

| Behavior | Contract |
| --- | --- |
| Source order | Result rows preserve the caller's source list order |
| Source-local query | Runs before schema reconciliation |
| `strict` schema policy | Requires identical mapped fields and portable types |
| `union` schema policy | Uses first-seen column order and typed nulls for missing fields |
| Column mapping | Explicitly renames source fields into the federated namespace |
| Global query and limit | Run after reconciliation across the complete append |
| Early termination | Closes the active child and does not open later sources |
| Provenance | Every batch reports source id, source index, and child batch index |
| Cancellation | Covers deferred source resolution and child iteration |

Parallel scheduling, implicit type coercion, optimizer-selected source order, and managed
multi-source joins are intentionally outside this API.

## Vector table views

Tiles and feature services retain their specialized addressing APIs. An adapter can bind one tile
or one bounded service request, require Arrow output, and expose the resolved feature table to the
portable relational executor.

This boundary is deliberate:

- z/x/y, tile layers, service layers, bounds, and output CRS remain source parameters;
- predicates, projection, expressions, ordering, aggregates, and limits apply to the resolved rows;
- cross-tile planning and server-side filter translation are not implied by the adapter.

The format page uses a blue **Scan table view** badge for this narrower participation mode rather
than the green **Scan supported** badge used by sources with a native common scan entry point.

`VectorFeatureTableScanSource` exposes `query()` for an Arrow table and `scan()` / `read()`
for one Arrow result batch, plus `getQueryMetadata()` and `explain()`. See the
[feature-service query example](/docs/developer-guide/spatial-queries#use-the-common-scanquery-interface)
for filtering and projection over a bounded service request. Metadata describes the input bounds
CRS independently of the output geometry CRS. The first execution materializes and caches the
service response; table operators run locally and do not imply pagination or server-side pushdown.

## Bundle-size boundary

- Import a format package alone for ordinary loader and source APIs.
- Import `@loaders.gl/core/query` only when the application needs the reference executor, shared query
  parser, federation, or vector table-view adapters.
- Register optional backends with a loader function so their implementation can remain in a
  separate dynamic chunk.
- UI components remain in the website/application layer and are not runtime dependencies.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md)
and the project-wide [Attributions and Credits](/docs/references-and-credits).

## Logical queries and execution options

`TableQuery` describes the requested result with `select`, `where`, and `limit`.
A selection is a column name or `{column, as}`. It contains neither an abort signal
nor callbacks. `TableQueryExecutionOptions` holds the controls for one execution:
`signal` and `onQueryComplete`.

The logical type is the foundation for the upcoming query frontend; this change does
not add `load(..., {query})` or execute aliased selections. Current scan methods still
accept their `columns`, `predicate`, and `limit` options.

```ts
import type {TableQuery, TableQueryExecutionOptions} from '@loaders.gl/core/query';

const query: TableQuery = {
  select: [{column: 'longitude', as: 'lng'}, 'latitude'],
  where: {op: '>', args: [{property: 'population'}, 100000]},
  limit: 1000
};

const execution: TableQueryExecutionOptions = {
  signal: controller.signal,
  onQueryComplete: summary => console.log(summary.status, summary.rowsReturned)
};

// Existing scan sources accept the execution controls alongside their scan options.
for await (const batch of source.read({columns: ['longitude'], ...execution})) {
  consume(batch);
}
```

`onQueryComplete` receives one `TableQueryExecutionSummary` when an entered scan
execution terminates, including failure, cancellation, a limit, or consumer return.
Its `status` is `completed`, `early-terminated`, `cancelled`, or `failed`.
Exceptions thrown by the observer do not change query results. An iterator that is
never started does not report completion. Format-specific diagnostic callbacks,
such as `parquet.onTelemetry`, are separate from this terminal query callback.

### Logical query planning

`normalizeTableQuery(sourceColumns, query)` expands selections into explicit `{column, as}`
mappings. `planLogicalTableQuery(sourceColumns, query)` reuses the scan planner to produce
scan, filter, aliased project, and limit steps. Import these helpers from
`@loaders.gl/core/query` (format adapters can use `@loaders.gl/core/loader-utils`).

```ts
const plan = planLogicalTableQuery(['longitude', 'population'], {
  select: [{column: 'longitude', as: 'lng'}],
  where: {op: '>', args: [{property: 'population'}, 100000]},
  limit: 1000
});
// scan longitude + population; filter population; project longitude as lng; limit 1000
```

WHERE always refers to source names. Output names must be unique and non-empty;
one source column may be selected under multiple distinct aliases. Omitting `select`
selects every source column; an explicit empty selection is rejected. Limits must be
non-negative safe integers. Unknown query and selection fields are rejected.
Normalization creates frozen selection mappings without modifying the input predicate.
These helpers plan operations only; execution of aliased projections is a separate step.

### Arrow projection and renaming

`queryArrowTable()` accepts and returns Apache Arrow `Table` objects. Use
`select` for ordered projection with aliases:

```ts
const result = queryArrowTable(table, {
  select: [{column: 'longitude', as: 'lng'}, 'latitude'],
  predicate: {op: '>', args: [{property: 'population'}, 100000]},
  limit: 1000
});
```

Predicates resolve against source fields before aliases are applied. `select` cannot be
combined with `columns` or relational operators in this linear execution path.
`explainArrowTableQuery()` reports the aliased output names and physical source columns.

The shared `projectArrowTable(arrowTable, selections)` helper is available through
`@loaders.gl/core/scan/arrow-execution`. Projection creates schema and batch wrappers while
reusing data buffers, including nested children and dictionaries. It preserves field
names/types/nullability/metadata, schema metadata, RecordBatch metadata and boundaries,
and row order; selected aliases replace only field names. Projection-only limits retain
Arrow slice views. Sparse residual filters use math.gl's Arrow row gatherer to copy
physical buffers without decoding nested or dictionary-encoded columns.

### Streaming linear Arrow queries

`queryArrowTableInBatches(batches, options)` consumes and yields native Arrow RecordBatches
without collecting its output. It accepts predicates, ordered projection, aliases, a global
limit, and cancellation. Sorting, aggregates, expressions, unions, and joins remain on the
existing materializing paths.

The in-memory executor and Arrow IPC source now share `filterArrowTable()` from
`@loaders.gl/core/scan/arrow-execution`. Predicate evaluation reads Arrow vectors directly and
operates independently on each RecordBatch. All-pass batches reuse their data; all-reject
results retain the schema; contiguous results are slices; scattered results gather values.
Memory for predicate indices is bounded by one input batch. Slices may retain the original
input buffers. The collected in-memory API still retains its complete returned result.

The common `executeTableScanBatches()` executor awaits asynchronous filter kernels and
passes their abort signal, allowing adapters to dispatch work through the existing worker
transport. It requests input only as the consumer advances, closes upstream on consumer
return or failure, and stops without an extra pull when a global limit is reached exactly.
Async worker kernels must observe the supplied signal; there is no new worker protocol.

Projection and filtering kernels live in the optional `scan/arrow-execution` subpath.
Schema utilities and ordinary loader entry points do not import these kernels; format
query adapters import the focused subpath rather than the full scan entry point.

### Asynchronous table queries

Use `query()` for a collected Arrow table and `queryInBatches()` for streamed Arrow batches.
Both accept logical queries or SQL through an injected parser, with loaded tables, URL source
loaders, and named data sources. See [Querying tables](/docs/developer-guide/querying-tables) for
examples and the [query API reference](/docs/modules/core/scan/query) for signatures, execution
semantics, source capabilities, and benchmarks.

## Query naming and pushdown capabilities

New applications can import `query` and `queryInBatches` from `@loaders.gl/core/query`.
The legacy `/scan` entry point and its focused subpaths remain available; `/query` aliases share
exactly the same runtime implementation.

Source metadata exposes `queryCapabilities` (with the legacy `capabilities` alias). Its `.table`
field is a `TableQueryCapabilities` contract, including optional `cast` and `offset` support.
Use `createQueryMetadata({..., queryCapabilities: {table: ...}})` for new source adapters.
`TableQuerySource` and `TableQueryReadOptions` are the preferred source contract names.

Formats may expose `queryPushdownCapabilityHints` for discovery. These optional hints are not
execution guarantees: effective source capabilities and per-query planning determine pushdown.
Missing hints mean unknown.

For simple queries, the runtime delegates offset only after all filtering has been handled by the
source. Otherwise it retains the offset and may request `offset + limit` rows when safe. A residual
CAST filter prevents premature offset/limit pushdown.

Sources with exact native query support may implement `planQueryPushdown(query, {signal})`.
It returns `null` to retain portable execution, or `{schema, read}` to accept the entire query,
including CAST conversions, projection, predicates, offset, and limit. Planning must not read rows;
`read({signal})` supplies Arrow table batches lazily. The runtime validates the output schema and
handles empty results, cancellation, and iterator cleanup. A source must match portable null,
overflow, error, and row-order semantics before accepting a query. Existing format sources do not
claim universal native CAST support; their unsupported conversions continue to execute in Arrow.

For mixed SELECT lists, adapters can also implement
`supportsQueryProjectionPushdown(selection)`. Return true only for expressions with exact
native results and no row-dependent errors. Core can then ask the source to evaluate those
items and return the input columns needed by Arrow for the remaining items. The source must
accept the rewritten query with its original filter, offset, and limit. Returning `null`
from planning keeps execution on the existing fallback path.
