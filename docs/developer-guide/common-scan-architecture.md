import {FederatedScanLiveExample} from '@site/src/components/docs/federated-scan-live-example';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';

# Common Scan Architecture

<CapabilityHero capability="scan" />

## Try a scan

<FederatedScanLiveExample />

## Start here

Describe the data you need with bounds, selected columns, predicates, and limits. loaders.gl applies
that request across supported local and cloud data sources; the planning details below matter only
when you need to inspect or optimize execution.

The loaders.gl common scan architecture is a portable query and execution model for columnar data.
It allows an application to describe a small relational query once and execute it against an
in-memory Arrow table, a remote Parquet dataset, a versioned table format, a SQL database, or a GPU
dataframe without forcing those systems to share one physical implementation.

The architecture is intentionally layered. Iceberg manifests, Delta logs, Lance fragments,
Parquet row groups, DuckDB SQL, Arrow vectors, and GPU selection masks remain specialized. What
they share is the logical meaning of a query and a small set of execution invariants.

> The portable query is a contract between planners and executors. It is not intended to become a
> second implementation of the complete SQL language.

## Format-family support at a glance

This is the end-user view of the architecture. The statuses are deliberately conclusive:

- **Supported** means query metadata names a common execution method that works today. The details
  say which operations are pushed down and which are evaluated after decoding.
- **Metadata only** means the source can populate discovery UI but does not claim a common scan
  executor. Its metadata includes a concrete reason and the panel disables execution.
- **Not implemented** means the format has no common scan adapter.
- **Outside protocol** means the format intentionally uses a specialized tile, service, or catalog
  API instead of pretending to implement a scan.

| Format or source | Status | Common entry point | Supported scope |
| --- | --- | --- | --- |
| In-memory Arrow / GeoArrow | Supported | `read()` | Portable predicates, projection, limit, expressions, ordering, aggregates, unions, and joins; `query()` also returns a materialized table. |
| Arrow IPC | Supported | `read()` | Schema discovery, residual predicates, projection, global limit, cancellation, explain output, and streaming Arrow batches. |
| Parquet / Iceberg | Supported | `read()` | Projection, predicate and metadata pruning, global limits, cancellation, and streaming Arrow batches. |
| Delta Lake | Supported | `read()` | Read-only versioned snapshot replay, active-file planning, Parquet filtering, global limits, cancellation, and explain output; tables with deletion vectors are rejected explicitly until decoding is available. |
| FlatGeobuf | Supported | `read()` | R-tree bounding-box pruning, residual predicates, projection, limits, cancellation, and Arrow feature batches. |
| CSV | Supported | `read()` | Streaming projection and limit with residual predicates. |
| NDJSON / JSONL | Supported | `read()` | Streaming projection and limit with residual predicates. |
| ORC | Supported | `read()` | Materialized Arrow reads with residual projection, predicate, and limit. |
| GeoPackage | Supported | `read()` | Selected feature-table discovery and materialized Arrow reads with residual projection, predicate, and limit. |
| GeoTIFF / COG | Supported | `getRaster()` | Bounds and overview selection, bands, typed output, and validated raster queries. |
| OME-TIFF | Supported | `getRaster()` | Multiscale levels, channels, slices, typed output, and validated raster queries. |
| GeoZarr / OME-Zarr | Supported | `getRaster()` | Chunk-aligned bounds, channels or variables, multiscale levels, slices, and typed output. |
| COPC / Potree | Supported | `scan()` | Ordered hierarchy traversal, bounds and level-of-detail pruning, residual attribute predicates, caller-ordered projection, global limits, cancellation, and Arrow point batches. |
| NetCDF | Supported | `getRaster()` | Numeric variable selection, named half-open dimension slices, typed output, cancellation, and validated raster queries. |
| Lance / Shapefile / MLT / LAS / LAZ / PLY / PCD | Not implemented | — | Their existing loaders or specialized sources do not expose the common scan contract. |
| DuckDB / Snowflake SQL | Supported | `query()` | Compiles the portable table query to bound SQL; this is a backend rather than a file-format adapter. |
| MVT / PMTiles / 3D Tiles / I3S | Outside protocol | — | Use tile and tileset source APIs; tile addressing and level-of-detail remain outside `TableQuery`. |
| WMS / WFS / STAC and other services | Outside protocol | — | Use the service or catalog APIs; they are not normalized into the scan contract. |

The matrix describes the public experience, not identical physical performance. A residual
operator is still supported and correct; it simply does not avoid decoding work. Each scan-aware
source publishes the same conclusion through `ScanQueryMetadata.execution`, so documentation and
query panels do not have to infer support from a collection of capabilities.

## Why a common scan architecture?

Columnar storage systems often expose nearly identical user-facing controls under different names:

- choose output columns;
- filter rows;
- stop after a limit;
- select a table version or snapshot;
- stream bounded batches;
- cancel outstanding work.

Their physical opportunities are very different. An Iceberg planner can reject manifests before
opening data files. A Parquet reader can reject row groups and pages. Lance can select fragments and
eventually use scalar or vector indices. Arrow can evaluate vectors already in memory. DuckDB can
optimize generated SQL. A GPU executor can retain a mask or index buffer rather than materializing
rows.

Without a common logical query, every source grows its own predicate tree, projection rules, limit
semantics, and tests. With a common logical query, sources can specialize in planning and execution
while applications retain one meaning for the request.

## Architectural overview

```text
Application
    |
    | TableQuery
    v
Logical query normalization
    |
    +----------------------+----------------------+----------------------+
    |                      |                      |                      |
    v                      v                      v                      v
Catalog planner       SQL compiler          Arrow executor         GPU executor
    |                      |                      |                      |
    | ScanPlan             | SQL + bindings       | Arrow table          | mask/indices
    v                      v                      v                      v
Iceberg / Delta /      DuckDB / Snowflake     in-memory vectors      luma.gl/WGSL
Lance / Parquet
    |
    v
bounded scan tasks -> decoded Arrow batches
```

The logical query does not prescribe whether a backend materializes rows, returns batches, or
retains selection indices. It prescribes which rows and columns are visible to the caller and in
which source order they are selected.

### Catalog fragments

Catalog-backed sources may additionally implement `ScanFragmentProvider`. Its
`getScanFragments()` method returns immutable, format-neutral descriptors after cheap catalog
pruning and before opening Parquet pages:

```ts
type ScanFragment = {
  id: string;
  uri?: string;
  partitionValues?: Record<string, unknown>;
  byteLength?: number | bigint;
  rowCount?: number | bigint;
  metadata?: Record<string, unknown>;
};
```

`ParquetDatasetSource` exposes descriptor-selected files through this contract. `IcebergTableSource`
uses the same shape for snapshot-selected data files and preserves snapshot, manifest, partition,
schema, and column-bound metadata. The fragment layer is deliberately separate from Parquet row
groups: catalog planning chooses files, while the Parquet executor continues to choose row groups,
pages, and byte ranges.

## The portable logical query

The foundational types live in `@loaders.gl/loader-utils`, below every storage, SQL, and Arrow
package. The query is generic over a compatible columnar predicate so a format may narrow property
paths or values without cloning the logical operators:

```ts
type TableQueryOptions<PredicateT extends ColumnarPredicate = ColumnarPredicate> = Readonly<{
  predicate?: PredicateT;
  columns?: readonly string[];
  limit?: number;
}>;
```

SQL specializes this with `SQLPredicate`, which permits named parameters and string column names.
Parquet specializes it with concrete values and string-or-path properties. A bound SQL predicate is
therefore directly usable by Parquet, Arrow, Iceberg, and future GPU executors.

This represents four logical operators in a fixed order:

```text
scan -> filter -> project -> limit
```

The ordering is part of the contract:

- Predicate columns remain available during filtering even when they are absent from `columns`.
- Projection controls only the visible result schema.
- `limit` counts rows that survive the predicate.
- The retained rows preserve source order unless a future ordering operator explicitly changes it.

Cancellation belongs to an execution request rather than the immutable logical plan. This keeps
the plan serializable, cacheable, comparable, and suitable for worker or GPU transport.

### Canonical logical planning

`planTableQuery(sourceColumns, query)` validates the query and emits an immutable plan. For example,
filtering by a hidden `population` column while returning only `name` produces:

```ts
[
  {kind: 'scan', columns: ['name', 'population']},
  {kind: 'filter', predicate},
  {kind: 'project', columns: ['name']},
  {kind: 'limit', limit: 10}
]
```

This plan is intentionally logical. Parquet may fuse scan, filter, and project into selective byte
ranges; DuckDB may compile the whole sequence to one prepared statement; Arrow may interpret the
steps over vectors; luma.gl may lower filter to WGSL and retain indices. Operator fusion is welcome
as long as the visible result is equivalent.

### The source contract

Format adapters that participate in the table scan architecture implement `TableScanSource`. It
combines metadata discovery with an ordered batch reader:

```ts
type TableScanSource<BatchT, PredicateT extends ColumnarPredicate = ColumnarPredicate> =
  ScanQueryMetadataProvider & {
    read(options?: TableQueryOptions<PredicateT> & {signal?: AbortSignal}): AsyncIterable<BatchT>;
  };
```

`getQueryMetadata()` is intentionally cheap and drives the query panel. `read()` is the execution
boundary: it may prune manifests, row groups, pages, or ranges, but it must preserve the logical
plan's projection, three-valued predicate semantics, source ordering, and global limit. Parquet is
the reference implementation: its `ParquetSource` exposes the shared capabilities and explainable
logical plan while adding row-group, page-index, Bloom-filter, range, and worker details.

### Package ownership

| Layer | Owning package | Responsibility |
| --- | --- | --- |
| Portable values and predicates | `@loaders.gl/loader-utils` | AST types, paths, traversal, validation, immutable binding |
| Logical table query | `@loaders.gl/loader-utils` | query options, canonical plan, capability vocabulary |
| SQL syntax and compilation | `@loaders.gl/sql` | parser, SQL validation, identifier quoting, placeholders and bindings |
| In-memory execution | `@loaders.gl/sql/arrow-query` | exact Arrow semantics for the portable query |
| Physical columnar scans | `@loaders.gl/parquet` | files, ranges, pruning, decoding, residual filtering, batches |
| Table-format planning | `IcebergTableSource` and future peers | snapshots, manifests/logs, deletes, file selection |

Keeping the common contracts in loader-utils avoids making Parquet or GPU code depend on a database
adapter. SQL retains compatibility exports from `@loaders.gl/sql/table-query` while new generic
planners can import the lower-level contract directly.

### Optional scan runtime

Applications that want the shared planner and reference executor can opt into the single
`@loaders.gl/scan` package:

```ts
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/scan';

const engine = await createScanEngine();
const result = engine.query(table, {
  predicate: parseSQLPredicate('population >= 1000000'),
  columns: ['name', 'population'],
  limit: 100
});
```

Arrow is the built-in reference backend. The factory is asynchronous so optional backends can be
loaded later without adding backend-specific imports to application code. Format adapters continue
to import only the lightweight contracts from `@loaders.gl/loader-utils`; importing a format or
loading metadata does not require the scan runtime. The proof-of-concept backend registry is
intentionally internal to this one public package rather than exposing a family of backend
subpaths.

The same optional package is also the application-facing home for the source-neutral query state
and metadata vocabulary:

```ts
import type {ScanQuery, ScanQueryMetadata} from '@loaders.gl/scan';

const query: ScanQuery = {columns: ['name'], limit: 25};
async function describe(source: {getQueryMetadata(): Promise<ScanQueryMetadata>}) {
  return await source.getQueryMetadata();
}
```

`ScanQuery` is intentionally a control-state shape, not a promise that every source supports every
field. An adapter normalizes the values it understands and reports the rest through metadata
capabilities. This keeps the panel reusable without making React, a database client, or a GPU
runtime a dependency of the scan package. Format packages continue to implement the contracts from
`@loaders.gl/loader-utils`, so applications that do not use scanning pay no scan-runtime bundle
cost.

## Predicates and SQL semantics

Portable predicates use a small JSON-shaped tree:

```ts
const predicate = {
  op: 'and',
  args: [
    {op: '>=', args: [{property: 'year'}, 2024]},
    {op: '=', args: [{property: 'cancelled'}, false]}
  ]
};
```

The initial operators are:

- comparisons: `=`, `<>`, `<`, `<=`, `>`, `>=`;
- membership: `in`;
- null testing: `isNull`;
- Boolean composition: `and`, `or`, `not`.

Evaluation follows SQL three-valued Boolean semantics. A comparison with null is unknown, not
false. `NOT unknown` remains unknown. A row is retained by a filter only when its predicate result
is true.

This detail matters when the same predicate is evaluated by JavaScript, compiled to SQL, pruned
against statistics, or lowered to WGSL. Conformance tests must cover nulls as carefully as ordinary
values.

### Named parameters

Named parameters can remain in the predicate until execution:

```ts
const predicate = parseSQLPredicate('fare >= :minimumFare', {
  preserveParameters: true
});
```

The retained node is data, not interpolated SQL:

```ts
{parameter: 'minimumFare'}
```

An Arrow executor can bind the value immediately before evaluation. An SQL compiler turns it into
a positional placeholder. A GPU executor can preserve the parameter as a dynamic uniform or
expression input. This allows one plan to be cached while parameter values change.

## SQL-backed execution

SQL data sources accept raw SQL for full database functionality and a table-bound query object for
portable scans:

```ts
const rows = await dataSource.queryRows(
  {
    tableName: 'flights',
    columns: ['carrier', 'fare'],
    predicate: parseSQLPredicate('year >= :minimumYear', {preserveParameters: true}),
    limit: 100
  },
  {parameters: {minimumYear: 2024}}
);
```

The source compiles this request to dialect-specific parameterized SQL:

```sql
SELECT "carrier", "fare"
FROM "flights"
WHERE ("year" >= ?)
LIMIT 100
```

Identifiers are quoted by the compiler. Values are passed separately to the adapter. Raw SQL text
continues to be accepted when an application needs joins, aggregates, window functions, DDL, or
other operations outside the portable scan contract.

## Catalog planning and physical scans

Versioned table formats are catalog planners over physical data files:

```text
Iceberg metadata JSON
    -> snapshot
    -> manifest list
    -> manifests
    -> active data and delete files
    -> Parquet scan tasks

Delta transaction log
    -> selected version
    -> active add files and deletion vectors
    -> Parquet scan tasks

Lance manifest
    -> version
    -> fragments and data files
    -> Lance scan tasks
```

The table-format planner owns table correctness: snapshot selection, active-file discovery, schema
and partition evolution, and delete semantics. The physical reader owns byte ranges, decoding, and
batch production.

This separation prevents Iceberg and Delta from becoming alternate Parquet decoders. It also lets
plain Parquet datasets use the same physical machinery without pretending to have transaction-log
semantics.

## The pruning ladder

Predicates should be applied as early as they can safely prove that data cannot match:

```text
catalog pruning
    -> manifest or transaction-log pruning
        -> file and partition pruning
            -> row-group pruning
                -> page-index pruning
                    -> exact residual filtering
```

Every pruning layer is conservative. It may retain data that later proves not to match, but it must
never discard data that could match.

For example, the predicate `temperature > 30` can reject a Parquet row group whose declared maximum
is 22. If statistics are missing, truncated, incompatible, or contain ambiguous null information,
the planner retains the row group and leaves the predicate for a later layer.

### Pushed and residual predicates

A physical plan should distinguish:

- the pushed predicate used to avoid work;
- the residual predicate still requiring exact evaluation.

A backend does not need to support every predicate natively. Unsupported operations remain
residual work. This is the foundation of capability negotiation: lack of pushdown may cost time or
bytes, but it must not change results.

## Hidden required columns

The output projection is not always the physical read projection. A query may select `name` while
filtering on `population`. Iceberg equality deletes may require key columns absent from both the
predicate and the output. A spatial filter may need encoded geometry bounds.

Planning therefore distinguishes:

```text
output columns   = columns visible to the application
predicate columns = columns needed for exact filtering
delete columns    = columns needed to establish table correctness
required columns  = union of all physical requirements
```

Hidden required columns must be removed before a batch crosses the public result boundary.

## Limits, streaming, and cancellation

A limit is global to the logical query:

- it is not a limit per file;
- it is not a limit per row group;
- it is not a limit per emitted batch;
- it counts rows after exact filtering and deletes.

Once the limit is satisfied, the executor should cancel queued and active work that cannot
contribute visible rows. For a remote dataset this can prevent file discovery, HTTP ranges,
decoding, and Arrow allocation.

`ParquetSource`, `ParquetDatasetSource`, and `IcebergTableSource` implement this as one global
post-filter limit. It is applied after Iceberg deletes, may truncate the final Arrow batch without
losing row-position provenance, and ends the underlying ordered task iterator as soon as the count
is reached. A zero limit performs no file discovery or data reads.

Streaming executors should retain bounded memory. Concurrent file or fragment reads may run ahead,
but later tasks must not materialize unbounded results while an earlier ordered task is still
producing output.

## Deletes and versioned correctness

Delete handling belongs between physical reads and the visible result:

- Iceberg position deletes remove identified source positions.
- Iceberg equality deletes require key columns and sequence-number rules.
- Delta deletion vectors remove rows identified by the selected table version.
- Lance versions and fragments determine which physical rows are active.

Delete application may add hidden columns or row-position provenance to the physical scan. These
requirements must be planned before projection. A backend that cannot apply the required deletes
must report the capability gap instead of returning a plausible but incorrect table.

Snapshot and version selection remain source-specific execution options. They identify the table
state to scan; they are not row predicates.

## Backend result forms

The portable query defines logical results, not a single physical container:

| Backend | Natural result |
| --- | --- |
| Arrow | Arrow table or batches |
| Parquet/Iceberg/Delta | asynchronous Arrow batches |
| DuckDB/Snowflake | rows or Arrow table |
| Lance | asynchronous Arrow batches |
| GPU dataframe | selection mask or index buffer |

A GPU executor should not compact or download a table merely to imitate a CPU API. It may retain a
mask or indices and materialize only when a downstream consumer requires it.

## Capabilities

Sources and executors advertise optimization and execution capabilities separately from logical
correctness using the shared contract:

```ts
type TableQueryCapabilities = Readonly<{
  projection: 'unsupported' | 'residual' | 'pushdown' | 'pushdown+residual';
  predicate: 'unsupported' | 'residual' | 'pushdown' | 'pushdown+residual';
  limit: 'unsupported' | 'residual' | 'pushdown' | 'pushdown+residual';
  streaming: boolean;
  cancellation: boolean;
}>;

const PARQUET_TABLE_QUERY_CAPABILITIES = {
  projection: 'pushdown',
  predicate: 'pushdown+residual',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
};
```

`pushdown` means the backend has a physical opportunity to avoid work and can execute the requested
operator as part of physical planning. `pushdown+residual` means it can prune physical work before
decoding and still must evaluate the surviving rows exactly. Parquet uses this level for statistics
and page pruning followed by exact predicate evaluation. `residual` means correct local execution
without a storage-level optimization. `unsupported` is a correctness gap that must be rejected or
delegated.

Capabilities answer two different questions:

1. Can this backend produce correct results for the query?
2. How much of the query can it execute efficiently?

The planner may reject a query only for a correctness gap. An optimization gap should produce a
residual operator or a diagnostic.

## Query discovery and reusable controls

A reusable query editor needs more than an execution function. It needs to discover columns,
types, semantic roles, source bounds, and physical capabilities before it can construct a valid
query. Sources expose that information through `getQueryMetadata()` without materializing result
rows:

```ts
type ScanQueryMetadata = Readonly<{
  sourceType: string;
  queryType: 'table' | 'point-cloud' | 'raster';
  execution:
    | {status: 'supported'; method: 'read' | 'query' | 'getRaster' | 'scan'}
    | {status: 'metadata-only'; reason: string};
  name?: string;
  description?: string;
  schema: Schema;
  columns: readonly ScanColumnMetadata[];
  capabilities: ScanQueryCapabilities;
  spatial?: ScanSpatialMetadata;
  statistics?: {rowCount?: number | bigint; byteLength?: number | bigint};
}>;
```

`execution` is the authoritative support conclusion. A supported source names the common method
applications can call; a metadata-only source supplies the concrete missing capability. The helper
rejects methods that do not match the query family, such as `read()` for a raster query.

`schema` is the authoritative execution schema. `columns` is a panel-ready view of those fields
that adds semantic roles such as `identifier`, `geometry`, `x`, `y`, `z`, `time`, `intensity`, or
`classification`. The common `createScanQueryMetadata()` helper derives names, types, nullability,
titles, and descriptions from a loaders.gl schema; adapters only annotate roles that cannot be
inferred from physical Arrow types.

The discovery call is intentionally separate from `getMetadata()` and `getSchema()`:

- `getMetadata()` describes the dataset in its native domain, for example vector layers or an
  Iceberg snapshot.
- `getSchema()` returns the source's conventional schema, which may omit synthetic query columns
  such as GeoArrow geometry.
- `getQueryMetadata()` returns exactly the columns and controls visible to the portable query.
- `explain()` accepts a proposed query and reports its logical and physical plan without reading
  result rows.

This distinction lets a FlatGeobuf vector source preserve its established property-only
`getSchema()` contract while exposing the generated `geometry` column to a query panel. Parquet can
obtain the same shape from its footer, Iceberg from table and manifest metadata, Arrow directly
from its schema, and a SQL source from catalog schema discovery.

A framework-specific panel can remain outside the scan core. Its data flow is small and reusable:

```text
source.getQueryMetadata()
    -> execution status / disabled reason
    -> column projection picker
    -> typed predicate builder
    -> named parameter inputs
    -> optional bounds / level-of-detail controls
    -> capability badges
    -> source.explain(query)
    -> source.read(query) or source.query(query)
```

Named values are discovered from the AST with `getColumnarPredicateParameterNames()`. The panel
does not need to parse SQL text, and parameter values remain separate from the immutable predicate.
This is important for prepared SQL, GPU uniforms, saved queries, and URL state.

Discovery should normally require only headers, footers, manifests, catalog calls, or already
available in-memory schemas. It must accept cancellation and must not silently begin a full data
scan. Column statistics and enumerated value hints can be added later, but should identify whether
they are exact or sampled before a panel uses them to constrain input.

## Explainability and telemetry

Remote scans are often optimized more by avoiding bytes than by decoding them faster. Planning and
execution should therefore expose a pruning narrative:

```text
1,842 files discovered
1,701 files pruned by partition
96 files pruned by statistics
45 files selected
31 files opened before LIMIT completed
14 row groups pruned
4 row groups decoded
18.2 MiB downloaded
```

Useful counters include:

- catalogs, manifests, fragments, and files inspected;
- files pruned by partition, bounds, or statistics;
- row groups and pages pruned;
- range requests and downloaded bytes;
- batches and rows decoded;
- rows tested and retained by residual predicates;
- work cancelled after early completion;
- time spent in planning, network, decode, filtering, and conversion.

The shared `explainTableQuery(sourceColumns, options, capabilities)` helper now exposes this
contract without executing a data scan. Its serializable result contains the normalized logical
plan, source/output/required columns, and per-operator `pushdown`, `residual`, or `unsupported`
annotations. Arrow and SQL expose lightweight wrappers, while `ParquetSource.explain()` adds
footer-only row-group counts (`requested`, `selected`, and `prunedByStatistics`). Format-specific
executors can add physical details without changing the portable query shape.

Explain output is intentionally diagnostic rather than a second execution API:

```ts
const explanation = await parquetSource.explain({
  columns: ['name'],
  predicate: {op: '>', args: [{property: 'value'}, 10]},
  limit: 100
});

explanation.operators.predicate.support; // 'pushdown' | 'pushdown+residual' | 'residual' | 'unsupported'
explanation.rowGroups?.prunedByStatistics;
```

Plans must not contain bound secrets or backend handles. Values may be represented by named
parameters, and telemetry remains the source of truth for what actually happened at execution
time. Supply `onTelemetry` to receive one immutable terminal snapshot:

```ts
let telemetry;
for await (const batch of source.read({
  predicate,
  limit: 100,
  onTelemetry: value => {
    telemetry = value;
  }
})) {
  render(batch);
}
```

The common fields cover status, files and tasks opened, bytes fetched, batches decoded, rows read,
tested, retained, returned, and pruned, wall time, early termination, cancellation, and error
state. Federated scans additionally preserve one record per source in append order. Physical
executors may retain additional immutable counters under `details`; consumers should not infer
portable behavior from those source-specific fields.

## Adding a new source

A new columnar source should answer these questions explicitly:

1. What identifies the logical table and optional version?
2. How is the schema discovered?
3. What are the independently executable scan tasks?
4. Which query operators can be pushed into metadata planning?
5. Which operators remain exact residual work?
6. What hidden columns or provenance are required for correctness?
7. How are batches ordered and bounded?
8. How are outstanding discovery, network, and decode operations cancelled?
9. Which telemetry demonstrates avoided work?
10. Which conformance cases prove portable semantics?

Implementations should reuse common query validation and scan-task execution. Format-specific code
should focus on metadata, pruning opportunities, decoding, indices, and correctness rules unique to
that format.

## Conformance expectations

Every executor of the portable query should share behavioral tests for:

- projection order;
- filtering on non-output columns;
- null and `NOT` semantics;
- `IN` semantics;
- named parameter rebinding;
- zero and non-zero limits;
- global limits across batches and files;
- early iterator return;
- cancellation before and during execution;
- unsupported pushdown becoming residual work;
- hidden columns not leaking into output.

Format-owning modules should add exhaustive pruning and correctness tests. Wrapper modules should
retain only focused public-entrypoint conformance tests.

## Reusing the scan query panel

Examples and applications should let the source describe its controls instead of maintaining a
format-specific list of column names. A compatible source exposes `getQueryMetadata()` before the
first data request:

```ts
const metadata = await source.getQueryMetadata();
```

The returned schema and capability descriptors drive the shared `ScanQueryPanel` used by the
documentation examples. Its source-neutral controls include:

- output-column projection, populated from `metadata.columns`;
- a global row limit, enabled only when the source advertises limit support;
- a source-coordinate bounding box when `metadata.spatial` and bounds pushdown are available.

For supported sources, the panel emits the same immutable query shape consumed by `read()`,
`query()`, `getRaster()`, or `scan()`. For metadata-only sources it still shows the discovered
schema but disables Apply and explains the missing executor. This keeps Iceberg, FlatGeobuf, Arrow,
point-cloud, and raster examples visually consistent without overstating their physical support. A source may add a format-specific editor
alongside the panel—for example, the Iceberg example retains its SQL/predicate editor—without
duplicating schema discovery or projection/limit controls.

`FederatedScanPanel` composes those controls with read-only managed-source discovery. It adds
source selection and ordering, strict-versus-union schema policy, explicit column mappings, named
predicate parameters, explain output, actual telemetry, and batch provenance. It does not replace
format-specific controls or expose live source objects from `DataSourceManager`.

When adding an example, load metadata first, render a loading state, and keep metadata failures
separate from scan failures. The preview should show bounded Arrow output and explain which work was
performed (for example, FlatGeobuf packed-R-tree pruning or Iceberg manifest planning), rather than
silently converting the result to an unrelated object format.

## Evolution rules

New logical operators should be added only when there is a real execution strategy and a clear
portable meaning. Likely future operators include ordering, scalar expressions, aggregates, unions,
joins, spatial predicates, and nearest-neighbor search.

Some operations may remain source extensions before they become portable. Lance vector search and
geospatial bounds are examples: both are valuable, but neither should distort the initial relational
scan contract.

The architecture favors small, composable contracts over a speculative universal AST. A useful
test for every addition is: can two materially different backends execute it with the same visible
semantics?

## Implementation status and roadmap

A format is considered scan-compatible when a user can discover its queryable fields and
capabilities, use the same query panel, and receive bounded Arrow or typed results without learning
a format-specific query API. Formats retain their own physical plans; compatibility describes the
portable behavior, not a shared decoder.

The roadmap is therefore format-support-first. Each tranche must ship three things together:

1. metadata-only discovery (`getQueryMetadata()` and the shared panel);
2. a correct scan adapter, even when initial filtering is residual; and
3. capability, explain, and conformance coverage that makes the remaining gaps visible.

### Tranche sequence

0. **Contract and reference implementation — landed.** Keep the generic predicates, immutable
   `TableQueryOptions`, point-cloud and raster siblings, canonical planning, late-bound parameters,
   capability vocabulary, ordered scan tasks, Arrow execution, and lazy DuckDB compilation stable.
1. **Optional package boundary — implemented in this stack.** Keep query state, metadata contracts,
   and the reference runtime in `@loaders.gl/scan`, while format adapters retain lightweight
   `@loaders.gl/loader-utils` dependencies. No UI or GPU code crosses this boundary.
2. **Panel everywhere — concluded for support signaling.** The shared panel consumes package-level
   metadata/query types, renders discovered raster overviews, and is exercised by FlatGeobuf,
   Parquet, Iceberg, CSV, and Arrow examples. It now shows the source's declared execution method
   and disables Apply with the source-provided reason for metadata-only adapters.
3. **Existing tabular and vector adapters — concluded.** In-memory Arrow, Arrow IPC, ORC, CSV,
   NDJSON, GeoPackage, and FlatGeobuf expose common executors. GeoPackage now closes the last
   residual-execution gap in this set. Shapefile and MLT are explicitly not implemented rather than
   being left in a planned state. Physical stripe, row-index, packed-index, and byte-range pruning
   remain performance improvements and do not change the support conclusion.
4. **Existing cloud and versioned tables — concluded.** Parquet, Iceberg, and Delta Lake read-only
   snapshots expose common execution. Delta replays versioned transaction logs and plans active
   Parquet fragments; checkpoint discovery, CDC, deletion-vector decoding, and writes remain
   separate format features. Lance is explicitly not implemented.
5. **Point-cloud execution — concluded.** COPC and Potree execute the shared point-cloud query through
   `scan()`. A common breadth-first hierarchy planner applies bounds, levels, and target spacing;
   adapters then apply exact bounds, residual predicates, caller-ordered projection, and one global
   limit while emitting bounded Arrow point batches. LAS/LAZ, PLY, PCD, and splats remain explicitly
   not implemented rather than partially supported.
6. **Existing raster adapters — concluded.** GeoTIFF/COG, OME-TIFF, GeoZarr, OME-Zarr, and NetCDF
   execute validated raster queries through `getRaster()`. NetCDF supports numeric variable reads
   and named dimension index or half-open range slices with typed output. Terrain and LERC remain
   explicitly not implemented.
7. **Tiles and services bridge — feature-table slice landed.** MVT/PMTiles vector tiles and bounded
   WFS/ArcGIS feature requests can now be bound through opt-in `@loaders.gl/scan` adapters. The
   physical tile address, layers, bounds, and CRS remain outside `TableQuery`; the resolved Arrow
   feature table exposes shared metadata, explain, cancellation, residual predicates, projection,
   relational operators, and limits. 3D Tiles, I3S, WMS imagery, and STAC remain specialized while
   shared time, level-of-detail, and non-table discovery metadata are still open.
8. **Portable relational growth — second slice landed.** Arrow and DuckDB now execute the shared
   ordering, scalar-expression, grouped-aggregate, `UNION ALL`, and equi-join request shapes.
   Ordered append federation now resolves named `TableScanSource` instances through the existing
   `DataSourceManager`, reconciles strict or union schemas with explicit column mappings, and
   enforces source order, one global limit, cancellation, early termination, and batch provenance.
   Managed multi-source joins remain outside this tranche.
9. **GPU and acceleration — deferred.** Lower the same plan to luma.gl/WGSL masks or indices, add deferred or
   materialized compaction, and compare GPU/CPU explain telemetry. Add spatial predicates and nearest
   neighbor only when indexed CPU, GPU, and remote-source strategies have compatible semantics.

### Format-support scorecard

This repeats the end-user support view beside the implementation roadmap so progress cannot drift
back into “foundation” or “planned” gray zones. “Supported,” “Metadata only,” “Not implemented,”
and “Outside protocol” have the exact meanings defined at the top of this page.

| Family and representative sources | Status | Execution | Correct behavior today | Remaining work |
| --- | --- | --- | --- | --- |
| In-memory Arrow / GeoArrow | Supported | `read()` | Portable relational execution; materialized `query()` is also available | Optimize vector paths and expand GeoArrow conformance |
| Arrow IPC | Supported | `read()` | Residual predicates, projection, global limit, cancellation, explain, telemetry, Arrow batches | More selective IPC batch pruning |
| Parquet / Iceberg | Supported | `read()` | Pushdown plus residual filtering and streaming | More pruning and explain detail |
| Delta Lake | Supported | `read()` | Versioned snapshot replay, active-file planning, Parquet filtering, and explicit deletion-vector rejection | Checkpoints, CDC, and deletion-vector decoding |
| FlatGeobuf | Supported | `read()` | Bounding-box pushdown and residual table query | More packed-index telemetry |
| CSV / NDJSON | Supported | `read()` | Streaming projection and limit, residual predicates | Byte-range and record-index pruning |
| ORC | Supported | `read()` | Materialized residual table query | Stripe and row-index pruning |
| GeoPackage | Supported | `read()` | Materialized residual feature-table query | SQL and spatial-index pushdown |
| Shapefile / MLT / Lance | Not implemented | — | No common scan claims | Add adapters only when end-to-end execution is available |
| COPC / Potree | Supported | `scan()` | Ordered hierarchy selection, exact bounds, residual predicates, projection, global limit, cancellation, and Arrow batches | Finer decoder projection and hierarchy telemetry |
| LAS / LAZ / PLY / PCD / splats | Not implemented | — | No common scan claims | Decide which formats justify sequential adapters |
| GeoTIFF / COG / OME-TIFF | Supported | `getRaster()` | Windows, bands/channels, levels, typed output | More chunk telemetry and pushdown |
| GeoZarr / OME-Zarr | Supported | `getRaster()` | Chunk-aligned windows, channels, levels, slices | More variable and dimension UI |
| NetCDF | Supported | `getRaster()` | Numeric variables, named dimension index/range slices, typed output, and cancellation | Range reads, chunk pruning, and broader NetCDF variants |
| Terrain / LERC | Not implemented | — | No common scan claims | Raster adapter design |
| MVT / PMTiles | Outside protocol; optional table view | `read()` after binding a vector tile | Tile addressing stays specialized; Arrow feature rows use portable residual queries | Cross-tile planning and tile-statistics discovery |
| 3D Tiles / I3S | Outside protocol | — | Specialized tile APIs | Shared bounds, time, level-of-detail, and explain metadata |
| WFS / ArcGIS FeatureServer | Outside protocol; optional table view | `read()` after binding a bounded request | Service controls stay specialized; Arrow feature rows use portable residual queries | DescribeFeatureType schema discovery and server-side filter translation |
| WMS / STAC | Outside protocol | — | Specialized imagery and catalog APIs | Shared time and non-table discovery metadata |

“Pushdown” is a promise about avoiding physical work, not merely accepting an option. Every adapter
must report `residual` when it decodes rows, features, points, or chunks before evaluating a filter.
The scorecard changes only when a source gains or loses a working common entry point. Optimization
tranches update the behavior and remaining-work columns without downgrading correct residual
execution to an ambiguous intermediate status.

The desired end state is not one monolithic engine. It is a family of specialized planners and
executors that agree on what a query means.

### Relational first slice

The first relational tranche deliberately stays small enough to run without a database ingest. An
in-memory Arrow table can evaluate computed numeric columns, stable multi-key ordering (including
explicit null placement), and `count`, `sum`, `min`, `max`, and `avg` aggregates. DuckDB receives the
same immutable options through the SQL compiler, with identifiers quoted and arithmetic guarded
against division by zero. Both executors apply filtering before expressions, ordering before the
global limit, and projection after computed or aggregate columns are available.

```ts
const query = {
  predicate: parseSQLPredicate("status = 'active'"),
  expressions: [{name: 'revenue', expression: {op: 'multiply', left: 'price', right: 'quantity'}}],
  columns: ['category', 'revenue'],
  orderBy: [{column: 'revenue', direction: 'desc', nulls: 'last'}],
  limit: 100
};
```

The Arrow executor remains intentionally row-oriented for this proof of concept: it materializes
only the rows needed by the relational operators and returns a bounded Arrow table. This gives
format adapters and the GPU executor a conformance target without committing them to the same
physical implementation. In-memory unions resolve named child tables through an explicit table map;
joins expose child fields with a source-qualified name and use SQL inner-join null semantics. SQL
backends compile the same child relations to `UNION ALL` and qualified `JOIN` statements. The
following managed append layer adds source registration and streaming resolution without extending
that materialized join path into a distributed executor.

### Managed append federation

The first managed federation layer is an ordered append, not a distributed database. Applications
register runtime sources once with `DataSourceManager`; `FederatedTableScanSource` subscribes to
their stable ids while discovering metadata or producing batches. This intentionally aligns scan
planning with the existing loaders.gl resource-management system:

```text
SourceLoader / application factory
              |
              v
       DataSourceManager
       (identity, lifetime,
        deferred resolution)
              |
              v
 FederatedTableScanSource
 (schema plan, ordered append,
  global query semantics)
              |
              v
     Arrow batches + provenance
```

The manager remains format-agnostic and does not inspect query capabilities. The federated adapter
requires each resolved object to publish supported table scan metadata and `read()`. Consequently,
CSV, NDJSON, Parquet, Iceberg, Delta, ORC, GeoPackage, FlatGeobuf, Arrow IPC, or an application
source can participate through the same registry when its concrete source implements that
contract.

Source-local queries use physical source names and run before reconciliation. Explicit mappings
then rename fields into the federated namespace. Under `strict`, every mapped schema must contain
the same fields with identical portable data types. Under `union`, columns are ordered by first
appearance and a source that lacks a field contributes typed nulls. The global predicate,
projection, and limit operate on this reconciled namespace. Callers may declare an output schema
to request safe numeric widening, dictionary-to-value normalization, and field ordering. Lossy
conversions, implicit string conversion, geometry coercion, and removal of nullability are rejected
before result rows are decoded.

Execution is serial by design. This is what makes the following guarantees inexpensive and
testable:

1. source-list order is row order;
2. a global limit counts rows after the global predicate;
3. reaching the limit closes the current child iterator and avoids opening later sources;
4. abort signals cover deferred source resolution as well as batch reads;
5. each result batch identifies its source id, source position, and physical batch position; and
6. manager subscriptions are released for completion, errors, cancellation, and early return.

Parallel scheduling, managed-source joins, optimizer-selected source order, schema coercion, and
distributed aggregation are explicit non-goals. The in-memory relational executor can still join
or union already supplied Arrow tables; that is a separate materialized execution path.

The interactive example near the top of this page registers real CSV, NDJSON, and Arrow IPC sources, discovers them without
exposing the managed source objects, applies explicit mappings and a named predicate parameter,
and shows both the plan and terminal execution telemetry. Source badges below the panel are the
provenance attached to emitted Arrow batches.

## Point-cloud participation

COPC and Potree participate through a sibling point-cloud query. They share relational attribute
semantics while retaining hierarchy and resolution controls that do not belong in `TableQuery`:

```ts
type PointCloudQueryOptions<PredicateT extends ColumnarPredicate = ColumnarPredicate> =
  TableQueryOptions<PredicateT> &
    Readonly<{
      bounds?: {
        minimum: readonly [number, number, number];
        maximum: readonly [number, number, number];
      };
      minimumLevel?: number;
      maximumLevel?: number;
      targetSpacing?: number;
    }>;
```

Projection chooses decoded point attributes. The predicate filters attributes with the same null
and comparison semantics as a table scan. Bounds select points in the source coordinate system,
and hierarchy levels or target spacing determine which physical nodes may contribute. The global
`limit` still counts points that survive bounds and predicates; it is not a license for each node
to emit its own limit.

`validatePointCloudQueryOptions()` applies ordinary table-query validation and additionally rejects
non-finite or inverted bounds, invalid hierarchy levels, and non-positive spacing. A point-cloud
adapter advertises table capabilities plus `bounds`, `levelOfDetail`, and `spacing` support.

COPC and Potree implement the same deterministic breadth-first hierarchy planner. Bounds prune
whole subtrees, `minimumLevel` suppresses coarse payloads while preserving traversal,
`maximumLevel` stops descent, and `targetSpacing` selects the first acceptable resolution. Their
hierarchy pages, node bounds, point counts, and encoded chunks create a clean pruning ladder:

```text
PointCloudQueryOptions
    -> COPC header and schema discovery
    -> hierarchy page traversal
    -> bounds / level / spacing node selection
    -> ordered node ScanTasks
    -> requested-attribute LAZ decoding
    -> exact residual bounds and attribute filtering
    -> global limit
    -> Arrow or GeoArrow point batches
```

The physical adapters remain separate because COPC and Potree differ in metadata, hierarchy
storage, point encoding, and URL layout. Both conservatively advertise hierarchy bounds, level, and
spacing selection as pushdown while keeping scalar attribute predicates and final point bounds
residual. COPC minimizes requested LAZ attributes; Potree currently decodes complete point records.

Both adapters expose `x`, `y`, and `z` roles even when their native attribute names use LAS
conventions such as `X`, `Y`, and `Z`. Intensity, classification, color, GPS time, and point-source
identifier roles allow the same query panel to render useful typed controls without embedding COPC
or Potree naming rules in UI code.

## Raster participation

GeoTIFF, Cloud Optimized GeoTIFF, Zarr, GeoZarr, OME-Zarr, NetCDF, and related multidimensional
formats participate in the scan architecture at the planning and execution layers. They should not
be forced into `TableQuery`: a pixel window, overview level, channel, and time slice are not
relational projection and row predicates.

A sibling logical request can express raster semantics directly:

```ts
type RasterQuery = Readonly<{
  bounds?: readonly [number, number, number, number];
  width?: number;
  height?: number;
  level?: number;
  variables?: readonly string[];
  channels?: readonly number[];
  slices?: Readonly<Record<string, number | readonly [number, number]>>;
}>;
```

The exact surface should be derived from the existing raster sources rather than standardized
prematurely. Its physical shape is already familiar:

```text
RasterQuery
    -> coordinate and resolution planning
    -> overview / array / chunk selection
    -> tile or chunk ScanTasks
    -> HTTP ranges and decompression
    -> typed-array raster tiles
    -> optional reprojection, resampling, or composition
```

Raster and table scans can share:

- bounded ordered or unordered task execution;
- cancellation and early iterator return;
- range scheduling, caching, retries, and object-version validation;
- worker dispatch and decompression;
- plan explanations and execution telemetry;
- spatial-envelope pruning;
- provenance attached to emitted batches or tiles.

Their pruning ladders are analogous without being identical:

| Table scan | Raster scan |
| --- | --- |
| catalog or snapshot | collection or array metadata |
| file or fragment | image, overview, or multiscale level |
| row group | tile or chunk |
| page | byte range or compressed block |
| residual row predicate | crop, mask, resample, or band math |

GeoTIFF contributes internal tile offsets, overview selection, and COG byte ranges. GeoZarr and
OME-Zarr contribute array metadata, chunk coordinates, multiscale levels, dimension labels, and
codec pipelines. Both can lower to the same `ScanTask` executor while preserving their natural
typed-array result forms.

NetCDF selects numeric variables and applies slices by discovered dimension name. A numeric slice
selects one index and removes that dimension; a tuple uses half-open `[start, stop)` semantics and
retains it. The current classic-file executor materializes the source before slicing, so slicing is
reported as residual even though the result is fully supported. Range reads and chunk pruning are
future physical optimizations, not prerequisites for the common `getRaster()` contract.

Cross-domain operations belong above the physical scan layer. For example, sampling a raster at
Arrow point coordinates or joining a raster window with vector features may coordinate a
`TableQuery` and a `RasterQuery`; it should not require either query type to absorb the other's
complete semantics.
