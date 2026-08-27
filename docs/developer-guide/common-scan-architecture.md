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

## Format-family support at a glance

This is the end-user view of the architecture. “Supported” means a source can be used through the
common scan contract today. “Partial” means useful metadata or Arrow reading exists, but some
operators or pushdown opportunities remain source-specific. “Specialized” means the format has a
different query model, such as tiles or raster windows, rather than a relational table scan.

| Format family | Status | What is supported |
| --- | --- | --- |
| Arrow / GeoArrow | Partial | In-memory projection, predicates, and limits; GeoArrow extension-column conformance is still expanding. |
| Parquet / Iceberg | Supported | Schema discovery, projection, filtering, global limits, streaming Arrow batches, cancellation, and metadata pruning. |
| FlatGeobuf | Supported | Arrow feature queries, R-tree bounding-box pruning, residual attribute filtering, projection, and limits. |
| DuckDB / Snowflake SQL | Supported | Raw SQL plus the portable table query with safe parameter binding. |
| CSV / JSONL / ORC | Planned | Existing loaders are available; common chunk, stripe, and row-index scans are next. |
| Delta Lake / Lance | Partial | Read-only metadata and Arrow-batch paths exist; common snapshot/fragment planning and predicate pushdown are incomplete. |
| COPC / Potree | Partial | Point-cloud metadata, coordinate roles, hierarchy bounds, level-of-detail, spacing, and capability discovery are available; full common point streaming is source-specific. |
| GeoTIFF / COG / Zarr / GeoZarr / OME-Zarr | Partial | Raster window, band/channel, overview/level, and multidimensional selection APIs are available with shared query validation and capabilities. |
| NetCDF | Partial | Header-only scan metadata exposes variables, dimensions, attributes, and file statistics; data reads and slice pushdown remain follow-up work. |
| MVT / PMTiles / 3D Tiles / I3S | Specialized | Use tile and tileset source APIs; tile addressing and level-of-detail remain outside `TableQuery`. |
| WMS / WFS / STAC and other services | Specialized | Use the service or catalog query APIs; they are not normalized into the table scan contract. |

The matrix describes the public experience, not identical physical performance. A source may accept
the same logical query while evaluating some operators after decoding; capability metadata and
explain output identify what was pushed down and what remained residual.

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
  name?: string;
  description?: string;
  schema: Schema;
  columns: readonly ScanColumnMetadata[];
  capabilities: ScanQueryCapabilities;
  spatial?: ScanSpatialMetadata;
  statistics?: {rowCount?: number | bigint; byteLength?: number | bigint};
}>;
```

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

## Reusing the scan query panel

Examples and applications should let the source describe its controls instead of maintaining a
format-specific list of column names. A compatible source exposes `getQueryMetadata()` before the
first data request:

```ts
const metadata = await source.getQueryMetadata();
```

The returned schema and capability descriptors drive the shared `ScanQueryPanel` used by the
documentation examples. The panel currently exposes three source-neutral controls:

- output-column projection, populated from `metadata.columns`;
- a global row limit, enabled only when the source advertises limit support;
- a source-coordinate bounding box when `metadata.spatial` and bounds pushdown are available.

The panel emits the same immutable query shape consumed by a source's `query()` or `scan()` method.
This keeps Iceberg, FlatGeobuf, Arrow, and future COPC/Potree or raster examples visually
consistent while preserving their physical executors. A source may add a format-specific editor
alongside the panel—for example, the Iceberg example retains its SQL/predicate editor—without
duplicating schema discovery or projection/limit controls.

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

## SOTA scan roadmap

“SOTA scan support” means that a user can open a supported loaders.gl format, discover its queryable
fields and capabilities, use the same query panel, and receive bounded Arrow/typed results without
learning a format-specific API. It does not mean that every format gets the same physical plan. The
winning strategy is to make more formats *scan-compatible* before making the portable language
larger.

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
2. **Panel everywhere — implemented for the first linear sources in this stack.** The shared panel
   now consumes the package-level metadata/query types, renders discovered raster overviews, and is
   exercised by FlatGeobuf, Parquet, Iceberg, CSV, and Arrow examples. The next increment adds a
   support badge and explain preview to each compatible example, then expands the panel to every
   source marked “Ready” or “Foundation” in the matrix below.
3. **Tabular and vector coverage.** Finish Arrow/GeoArrow as the conformance executor, then bring
   ORC, CSV, JSONL, GeoPackage, Shapefile, MLT, and existing FlatGeobuf paths to scan parity. Start
   with schema/projection/limit and residual predicates; add stripe, row-index, packed-index, or
   byte-range pruning only where the format can prove it safely.
4. **Cloud and versioned tables.** Complete Parquet/Iceberg parity, then add Delta Lake and Lance
   snapshot/fragment planners. Reuse delete semantics, hidden required columns, task ordering,
   global limits, and explain output. Do not create format-specific predicate ASTs.
5. **Point-cloud coverage.** Turn COPC and Potree foundations into bounded Arrow point batches with
   bounds pushdown, ordered hierarchy tasks, residual attribute predicates, and global point limits.
   Add LAS/LAZ as a sequential fallback and PLY/PCD/splats as metadata-first adapters where their
   native formats cannot prune remotely.
6. **Raster and multidimensional coverage.** Complete GeoTIFF/COG and Zarr/GeoZarr/OME-Zarr scan
   requests, then wire NetCDF. Add terrain/heightmap and LERC-backed sources through the same raster
   panel. Standardize window, resolution/overview, band/channel, variable, dimension slice, typed
   output, and chunk telemetry without pretending pixels are table rows.
7. **Tiles and services bridge.** Keep MVT, PMTiles, 3D Tiles, I3S, WMS, WFS, and STAC specialized,
   but expose shared discovery, bounds, time, level-of-detail, explain, and cancellation metadata.
   Where a source returns feature tables (for example MVT or WFS), offer an explicit table-scan view;
   keep tile addressing and rendering controls outside `TableQuery`.
7. **Portable relational growth — second slice landed.** Arrow and DuckDB now execute the shared
   ordering, scalar-expression, grouped-aggregate, `UNION ALL`, and equi-join request shapes. The
   next slice is planner-level source resolution and duplicate-column naming for larger federated
   plans before these operators become part of the default panel.
8. **GPU and acceleration.** Lower the same plan to luma.gl/WGSL masks or indices, add deferred or
   materialized compaction, and compare GPU/CPU explain telemetry. Add spatial predicates and nearest
   neighbor only when indexed CPU, GPU, and remote-source strategies have compatible semantics.

### Format-support scorecard

This is the end-user support view. “Ready” means the source can populate the shared panel and execute
the listed controls correctly today. “Foundation” means metadata/capabilities exist but the scan
adapter is incomplete. “Planned” means the normal loader exists, but no common scan contract is
exposed yet. A residual predicate is still correct; it simply cannot avoid decoding work.

| Family and representative sources | Status | Discovery | Projection / selection | Filter / spatial controls | Limit / stream | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Arrow / GeoArrow | Foundation | schema for Arrow tables | zero-copy/residual | residual, null-safe | yes / batches | P1: add common source and panel adapter |
| Parquet / Iceberg | Ready | footer/catalog | pushdown | statistics + residual | global / batches | maintain and extend |
| FlatGeobuf | Ready | header/index | Arrow properties | bbox pushdown, scalar residual | bounded / batches | maintain and panel |
| ORC | Planned | loader metadata only | planned | planned row-index/statistics | planned | P2 |
| CSV | Ready | header/sample | parser projection | residual | global / batches | P1 |
| JSONL | Planned | header/sample | planned | planned residual | planned chunks | P2 |
| GeoPackage / Shapefile / MLT | Planned | container/header | planned | planned spatial or residual | planned | P2 |
| Delta Lake | Planned | loader not yet present | planned | planned log/deletion-vector pruning | planned | P1 |
| Lance | Foundation | manifest/fragments | format-native | fragments + residual | global / batches | P1 |
| COPC / Potree | Foundation | header/hierarchy | point attributes | bounds pushdown, attribute residual | planned global / batches | P1 |
| LAS / LAZ / PLY / PCD / splats | Planned | header | sequential attribute decode | residual unless indexed | planned | P2 |
| GeoTIFF / COG | Foundation | TIFF/overview metadata | bands/windows | window pushdown | tile-local / typed arrays | P1 |
| Zarr / GeoZarr / OME-Zarr | Foundation | group/array metadata | variables/channels | chunk/window pushdown | chunked / typed arrays | P1 |
| NetCDF | Foundation | file dimensions/variables | metadata only | planned window/slice pushdown | planned chunked / typed arrays | P1 |
| Terrain / LERC | Planned | tile/codec metadata | bands/tiles | tile bounds | tile streams | P2 |
| MVT / PMTiles | Specialized | tile/catalog metadata | feature-layer selection | tile bounds, optional residual table view | tile streams | P2 |
| 3D Tiles / I3S | Specialized | tileset metadata | tile content | volume/LOD pushdown | tile streams | P2 |
| WMS / WFS / STAC | Specialized | service/catalog metadata | layer/asset selection | server-specific bounds/time | response streams | P3 |

“Pushdown” is a promise about avoiding physical work, not merely accepting an option. Every adapter
must report `residual` when it decodes rows, features, points, or chunks before evaluating a filter.
The scorecard should be updated whenever a source gains a panel, adapter, or conformance slice; it is
the primary progress report for the roadmap.

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
backends compile the same child relations to `UNION ALL` and qualified `JOIN` statements, leaving
source registration and federated catalog resolution to the next tranche.

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

COPC is the first physical target because its hierarchy pages, node bounds, point counts, and LAZ
chunks create a clean pruning ladder:

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

Potree can reuse the logical query, metadata roles, hierarchy selection interface, scan executor,
and result batches. Its physical adapter remains separate because Potree versions differ in
metadata, hierarchy storage, point encoding, and URL layout. Initial Potree support can conservatively
advertise bounds and level selection as pushdown while keeping scalar attribute predicates residual.

Both adapters should expose `x`, `y`, and `z` roles even when their native attribute names use LAS
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

Cross-domain operations belong above the physical scan layer. For example, sampling a raster at
Arrow point coordinates or joining a raster window with vector features may coordinate a
`TableQuery` and a `RasterQuery`; it should not require either query type to absorb the other's
complete semantics.
