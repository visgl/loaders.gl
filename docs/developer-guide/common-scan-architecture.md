# Common Scan Architecture

The loaders.gl common scan architecture is a portable query and execution model for columnar data.
It allows an application to describe a small relational query once and execute it against an
in-memory Arrow table, a remote Parquet dataset, a versioned table format, a SQL database, or a GPU
dataframe without forcing those systems to share one physical implementation.

The architecture is intentionally layered. Iceberg manifests, Delta logs, Lance fragments,
Parquet row groups, DuckDB SQL, Arrow vectors, and GPU selection masks remain specialized. What
they share is the logical meaning of a query and a small set of execution invariants.

> The portable query is a contract between planners and executors. It is not intended to become a
> second implementation of the complete SQL language.

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
  projection: 'unsupported' | 'residual' | 'pushdown';
  predicate: 'unsupported' | 'residual' | 'pushdown';
  limit: 'unsupported' | 'residual' | 'pushdown';
  streaming: boolean;
  cancellation: boolean;
}>;

const PARQUET_TABLE_QUERY_CAPABILITIES = {
  projection: 'pushdown',
  predicate: 'pushdown',
  limit: 'pushdown',
  streaming: true,
  cancellation: true
};
```

`pushdown` means the backend has a physical opportunity to avoid work; it does not promise that
every expression can be proven from metadata. Parquet still evaluates a residual predicate exactly
after conservative statistics and page pruning. `residual` means correct local execution without a
storage-level optimization. `unsupported` is a correctness gap that must be rejected or delegated.

Capabilities answer two different questions:

1. Can this backend produce correct results for the query?
2. How much of the query can it execute efficiently?

The planner may reject a query only for a correctness gap. An optimization gap should produce a
residual operator or a diagnostic.

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

explanation.operators.predicate.support; // 'pushdown' | 'residual' | 'unsupported'
explanation.rowGroups?.prunedByStatistics;
```

Plans must not contain bound secrets or backend handles. Values may be represented by named
parameters, and telemetry remains the source of truth for what actually happened at execution
time.
Execution telemetry can then annotate the plan with actual counts and durations.

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

## Roadmap

The implementation evolves in reviewable tranches. The foundation now provides the first four
items; the later work can land independently without changing portable query semantics:

1. **Foundation:** shared generic predicate, late binding, `TableQueryOptions`, canonical planning,
   capability descriptors, and common ordered scan-task execution.
2. **SQL adapters:** parameterized DuckDB and Snowflake compilation while retaining raw SQL for the
   full language.
3. **Reference executors:** switchable Arrow and lazy DuckDB execution over the same browser data,
   without ingesting the Arrow result into DuckDB.
4. **Physical scans:** common projection, predicate, and global-limit semantics across Parquet and
   Iceberg, including hidden predicate/delete columns and aligned provenance.
5. **Explain:** serializable physical plans, pushed-versus-residual diagnostics, and telemetry
   annotations.
6. **More table formats:** Delta transaction logs and deletion vectors, then Lance fragments and
   indices, reusing Parquet or format-native physical tasks as appropriate.
7. **GPU execution:** lower the shared predicate to luma.gl/WGSL masks or indices and add a
   GPU-specific limit/selection stage.
8. **Relational growth:** add ordering, expressions, aggregates, or joins only where at least two
   materially different backends need the same portable meaning.

The desired end state is not one monolithic engine. It is a family of specialized planners and
executors that agree on what a query means.

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

Cross-domain operations belong above the physical scan layer. For example, sampling a raster at
Arrow point coordinates or joining a raster window with vector features may coordinate a
`TableQuery` and a `RasterQuery`; it should not require either query type to absorb the other's
complete semantics.
