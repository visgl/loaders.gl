Module overview

# @loaders.gl/core/scan

Describe the rows, columns, bounds, and limits you need once, then let each source plan the most useful reads it can perform.

[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Get started](https://loaders.gl/next/docs/developer-guide/get-started.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/get-started.md)

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The scan execution map

## One query path. Format-specific readers.

The application describes the request once. Planning and range access stay shared while each storage format keeps its own physical decoder.

### Application request

Viewport / queryColumns + filterRender target

↓

### Table planner

Snapshot selectionManifest discoveryPartition pruning

↓

### Shared scan engine

File discoveryProjectionPredicate ASTBounded tasksRange accessBatch scheduling

↓

### Format-specific readers

**Parquet**row groups · pages · indexes

**Avro**blocks · schemas · records

**ORC**stripes · streams · indexes

**Lance · Vortex**native storage adapters

↓

### Common analytical result

Arrow batchesZero-copy pathsApplication / GPU

↓

### Browser-native runtime

Fetch + HTTP RangeWorkers + cancellationTyped arrays

Iceberg and other table formats can plan files above the shared engine; the matching reader still owns its schema, statistics, pages, blocks, or stripes.

The scan module

## Describe the work. Let the source plan the reads.

The scan runtime keeps query intent separate from the storage format, so an application can ask for columns, predicates, bounds, and limits while each source reports what it can execute.

01

Intent

Columns, predicates, bounds, limits, and ordering

02

Planning

Source metadata distinguishes pushdown from residual work

03

Execution

Arrow tables, addressed tiles, or bounded feature requests

04

Federation

Ordered append with schema reconciliation and provenance

`@loaders.gl/core/scan` is the optional application-facing runtime for portable queries. It collects the reference Arrow executor, query parsing, source-neutral query metadata, ordered append federation, and adapters that expose an already-addressed vector result as a table.

Format packages do not depend on this runtime. They implement lightweight contracts from `@loaders.gl/core/loader-utils`, so applications that only load or decode a format do not pay the scan runtime bundle cost.

## Table-format sources[​](#table-format-sources "Direct link to Table-format sources")

Iceberg, Delta Lake, and Hudi sources live under `@loaders.gl/tables/iceberg`, `/delta`, and `/hudi`. The scan runtime does not depend on table-format implementations. See the [Parquet module](https://loaders.gl/next/docs/modules/tables/parquet.md) and the [common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md) for source APIs.

Detailed guide

## Scan APIs and execution semantics

The reference below covers installation, table execution, source metadata, federation, vector views, cancellation, and backend registration.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core apache-arrow
```

## Query an Arrow table[​](#query-an-arrow-table "Direct link to Query an Arrow table")

Arrow is the built-in reference backend. `createScanEngine()` is asynchronous so an application can register another backend lazily without changing its calling code.

```
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/core/scan';



const engine = await createScanEngine();

const result = engine.query(table, {

  predicate: parseSQLPredicate("status = 'active'"),

  columns: ['id', 'status'],

  limit: 100

});
```

For backends that schedule asynchronous or compiled work, use the experimental `queryAsync()` path. The built-in Arrow backend supports it, and synchronous custom backends receive an automatic compatibility wrapper:

```
const result = await engine.queryAsync(table, {

  predicate: parseSQLPredicate("status = 'active'"),

  limit: 100

});
```

This remains an Arrow-in/Arrow-out boundary. GPU graph compilation and GPU-resident result ownership are backend-specific and are not implied by `queryAsync()`.

The query is immutable and follows `filter -> project -> limit` semantics. Predicate columns do not need to appear in the result projection, and a limit counts only rows that survive filtering.

## Discover source controls[​](#discover-source-controls "Direct link to Discover source controls")

Scan-aware sources expose metadata before execution. This is the contract used by the shared documentation query panel.

```
const metadata = await source.getQueryMetadata();



console.log(metadata.execution); // supported method, or a concrete unsupported reason

console.log(metadata.columns); // fields available to projection and predicates

console.log(metadata.capabilities); // pushdown, residual, or unsupported operators
```

Applications should use `metadata.execution`, not the existence of a method with a familiar name, to decide whether Apply is enabled. Capability metadata distinguishes correct residual execution from physical pushdown.

## Runtime surfaces[​](#runtime-surfaces "Direct link to Runtime surfaces")

| API                            | Use it for                                                         | Result                        |
| ------------------------------ | ------------------------------------------------------------------ | ----------------------------- |
| `createScanEngine()`           | Query one in-memory Arrow table                                    | Materialized Arrow table      |
| `registerScanBackend()`        | Register an application-owned lazy backend                         | No eager backend import       |
| `FederatedTableScanSource`     | Append managed table sources in stable order                       | Arrow batches with provenance |
| `VectorTileTableScanSource`    | Query one already-addressed MVT or vector PMTiles tile             | One Arrow feature batch       |
| `VectorFeatureTableScanSource` | Query one bounded WFS, OGC API Features, or ArcGIS feature request | One Arrow feature batch       |
| Query and metadata types       | Build source-neutral controls                                      | Serializable query state      |

## Ordered append federation[​](#ordered-append-federation "Direct link to Ordered append federation")

`FederatedTableScanSource` resolves child sources through the existing `DataSourceManager`. It is an ordered `UNION ALL`, not a distributed database.

| Behavior               | Contract                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| Source order           | Result rows preserve the caller's source list order                |
| Source-local query     | Runs before schema reconciliation                                  |
| `strict` schema policy | Requires identical mapped fields and portable types                |
| `union` schema policy  | Uses first-seen column order and typed nulls for missing fields    |
| Column mapping         | Explicitly renames source fields into the federated namespace      |
| Global query and limit | Run after reconciliation across the complete append                |
| Early termination      | Closes the active child and does not open later sources            |
| Provenance             | Every batch reports source id, source index, and child batch index |
| Cancellation           | Covers deferred source resolution and child iteration              |

Parallel scheduling, implicit type coercion, optimizer-selected source order, and managed multi-source joins are intentionally outside this API.

## Vector table views[​](#vector-table-views "Direct link to Vector table views")

Tiles and feature services retain their specialized addressing APIs. An adapter can bind one tile or one bounded service request, require Arrow output, and expose the resolved feature table to the portable relational executor.

This boundary is deliberate:

* z/x/y, tile layers, service layers, bounds, and output CRS remain source parameters;
* predicates, projection, expressions, ordering, aggregates, and limits apply to the resolved rows;
* cross-tile planning and server-side filter translation are not implied by the adapter.

The format page uses a blue **Scan table view** badge for this narrower participation mode rather than the green **Scan supported** badge used by sources with a native common scan entry point.

`VectorFeatureTableScanSource` exposes `query()` for an Arrow table and `scan()` / `read()` for one Arrow result batch, plus `getQueryMetadata()` and `explain()`. See the [feature-service query example](https://loaders.gl/next/docs/developer-guide/spatial-queries.md#use-the-common-scanquery-interface) for filtering and projection over a bounded service request. Metadata describes the input bounds CRS independently of the output geometry CRS. The first execution materializes and caches the service response; table operators run locally and do not imply pagination or server-side pushdown.

## Bundle-size boundary[​](#bundle-size-boundary "Direct link to Bundle-size boundary")

* Import a format package alone for ordinary loader and source APIs.
* Import `@loaders.gl/core/scan` only when the application needs the reference executor, shared query parser, federation, or vector table-view adapters.
* Register optional backends with a loader function so their implementation can remain in a separate dynamic chunk.
* UI components remain in the website/application layer and are not runtime dependencies.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/core/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
