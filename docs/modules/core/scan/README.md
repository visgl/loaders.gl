---
title: '@loaders.gl/core/scan'
description: A portable query runtime for bounded, selective reads across local and cloud data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {CrossFormatScanEngineGraphic} from '@site/src/components/docs/cross-format-scan-engine-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Module overview"
  title="@loaders.gl/core/scan"
  description="Describe the rows, columns, bounds, and limits you need once, then let each source plan the most useful reads it can perform."
  tone="violet"
  meta={['Arrow results', 'Range-aware sources', 'Portable query contract']}
  links={[
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Get started', to: '/docs/developer-guide/get-started'}
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

`@loaders.gl/core/scan` is the optional application-facing runtime for portable queries. It collects the
reference Arrow executor, query parsing, source-neutral query metadata, ordered append federation,
and adapters that expose an already-addressed vector result as a table.

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

Arrow is the built-in reference backend. `createScanEngine()` is asynchronous so an application can
register another backend lazily without changing its calling code.

```ts
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/core/scan';

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
- Import `@loaders.gl/core/scan` only when the application needs the reference executor, shared query
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
import type {TableQuery, TableQueryExecutionOptions} from '@loaders.gl/core/scan';

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
`@loaders.gl/core/scan` (format adapters can use `@loaders.gl/core/loader-utils`).

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

`queryArrowTable()` accepts `select` for ordered projection with aliases:

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
Arrow slice views. Predicates may still materialize new buffers for matching rows.

### Streaming linear Arrow queries

`queryArrowTableInBatches(batches, options)` consumes an asynchronous Arrow batch stream
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

### Asynchronous query entry points

Use `query()` for a collected Arrow table, or consume the same execution pipeline with
`queryInBatches()`. Both functions and their `QueryOptions` type are exported only from
`@loaders.gl/core/scan`.

```ts
import {query, queryInBatches} from '@loaders.gl/core/scan';

const request = {
  select: [{column: 'longitude', as: 'lng'}, 'latitude'],
  where: {op: '>', args: [{property: 'population'}, 100000]},
  limit: 1000
} as const;
const result = await query(request, {source: arrowTable, signal});
for await (const batch of queryInBatches(request, {source: tableSource, signal})) {
  consume(batch);
}
```

Inputs are loaders.gl Arrow tables, existing `TableScanSource` objects, and URL strings
with explicit source loaders. Named sources, SQL strings, and a synchronous entry point
are deferred. Execution controls
remain outside the logical query: `source`, `signal`, and `onQueryComplete` belong in the
second argument. Each public execution reports completion once, including errors,
cancellation, limits, and consumer return. Observer errors do not alter results.

Source metadata determines the output schema. Supported row and columnar batches are
converted to Arrow; output schema changes, including field nullability, are rejected. Empty results, including limit zero,
emit one empty schema-bearing batch so collected and streamed results retain their fields.
Limit zero discovers metadata without calling the source's `read()` method.

Sources receive required columns including hidden predicate fields. Predicate pushdown is
used only when advertised; `read()` must perform exact filtering for both `pushdown` and
`pushdown+residual`, including its own residual work after pruning. Other predicates run
locally. A limit is never pushed below an outstanding local predicate. Child completion
callbacks are omitted; the public query owns completion reporting. Its row counters describe
batches received and emitted, rather than estimating physical rows pruned by a source.

### Format conformance and benchmarks

`query()` and `queryInBatches()` accept CSV, NDJSON, Arrow IPC, and Parquet table
sources. WHERE uses source column names, including columns omitted by SELECT.
The adapters preserve source row order and apply a global result limit. Metadata
is preserved when the format and adapter provide it; text formats cannot recover
Arrow field metadata from the original data.

| Source | Projection | Predicate | Limit |
| --- | --- | --- | --- |
| CSV | After decoding | Local residual | Stops streaming |
| NDJSON | After decoding | Local residual | Stops streaming |
| Arrow IPC | Buffer views after decoding | Local residual | Stops streaming |
| Parquet | Column reads | Statistics pruning plus exact residual | Stops after matches |

Projection on sequential formats does not imply fewer input bytes or fewer decoded
columns. Parquet statistics prune candidate row groups; exact predicates still run
before the global limit. Public completion summaries count batches received by the
query. Use source telemetry for physical bytes and Parquet row groups.

CSV blank fields are empty strings, not SQL NULL. NDJSON infers primitive types from
the first non-null value in each field of its first decoded batch, then retains known
types in later all-null batches. Set `ndjson.schema` when the first batch is entirely
null or when nested values require a declared type. Output schema changes are rejected.
Discovery is bounded to one batch rather than reading the entire source.

Run `yarn bench query` or `yarn bench-headless query` for the hermetic query benchmark.
It generates 4096 identical rows in all four formats, warms metadata, and compares
collected and streaming all-pass, all-reject, contiguous, scattered, and limited
queries. Results are end-to-end queries per second; fixture encoding and metadata
discovery are outside the timed region. These small, warm, in-memory inputs do not
measure network performance or peak heap. Benchmark comparisons should use the same
runtime and machine.

Streaming retains predicate indices for one input batch and whatever buffers the
consumer retains. Arrow slices can retain the whole original buffer. `query()`
collects every output batch and therefore uses memory proportional to its result.
Consumers own source resources and should call `close()` when their source provides it.

### Querying URL sources

Supply an explicit URL-capable table source loader. A loader array selects only among
the supplied candidates; global loader registration is ignored. Parser-only loaders
are not source loaders and are rejected. Core does not import format implementations.

```ts
import {query} from '@loaders.gl/core/scan';
import {ParquetSourceLoader} from '@loaders.gl/tables';

const result = await query(
  {select: ['name'], where: {op: '>', args: [{property: 'population'}, 100000]}, limit: 20},
  {
    source: 'https://example.com/cities.parquet',
    loaders: ParquetSourceLoader,
    core: {fetch: authenticatedFetch},
    parquet: {batchSize: 1024},
    signal,
    onQueryComplete
  }
);
```

The source descriptor’s asynchronous preload hook and the shared authentication utilities
handle initialization. URL sources use their own format implementations, as they do
when constructed directly; this path does not import the full core loading API.
Format and request options stay in their existing namespaces in the second argument.
Logical projection, predicates, and limits belong in the first argument. Source loading
starts when streaming consumption begins; limit zero may read metadata to discover the
schema, but does not call the source's `read()`. The query closes sources it creates,
including on errors, cancellation, and consumer return. Caller-provided source objects
remain caller-owned. One completion summary includes source-open and cleanup failures;
a cleanup failure never replaces an earlier execution failure.
