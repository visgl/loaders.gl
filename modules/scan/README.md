# @loaders.gl/scan

Optional scan planning and execution for loaders.gl.

The package has one public entry point. Arrow is the built-in reference executor and establishes
the portable query semantics used by future backends.

```typescript
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/scan';

const engine = await createScanEngine();
const result = engine.query(table, {
  predicate: parseSQLPredicate('population >= 1000000'),
  columns: ['name', 'population'],
  limit: 100
});
```

The experimental asynchronous path is available on the same engine. It preserves the result
semantics while allowing a registered backend to schedule remote or compiled work:

```typescript
const result = await engine.queryAsync(table, {
  predicate: parseSQLPredicate('population >= 1000000'),
  limit: 100
});
```

Synchronous backends are wrapped automatically. GPU backends may use this boundary as a staging
point, but GPU graph compilation and resource ownership remain backend-specific.

Optional backends can register a lazy loader without adding backend-specific imports to application
code:

```typescript
import {createScanEngine, registerScanBackend} from '@loaders.gl/scan';

registerScanBackend('custom', async () => {
  const {createCustomBackend} = await import('./custom-backend');
  return createCustomBackend();
});

const engine = await createScanEngine({backend: 'custom'});
```

Format packages should depend on the lightweight scan contracts in `@loaders.gl/loader-utils` and
should not import this package merely to expose metadata or a native scan adapter. Applications opt
into this package when they want the shared planner or Arrow executor.

The same boundary applies to table execution. `executeTableScanBatches()` is the reusable residual
executor for object-row, columnar, GeoJSON, and Arrow-shaped batches. It owns filtering, projection,
global limits, cancellation, and terminal telemetry; a format adapter only supplies its parser's
batch reader. The helper is re-exported from `@loaders.gl/scan` for applications building custom
adapters, while format packages import it from `@loaders.gl/loader-utils`. This keeps the common
implementation in one place without making a CSV, JSON, or other format root import the optional
scan runtime (and therefore preserves tree-shaking for users who never scan).

Arrow-backed formats use the same layering for materialized queries. `queryArrowTable()` lives in
`@loaders.gl/schema-utils`, which already owns Arrow schema and vector utilities. ORC, GeoPackage,
and FlatGeobuf provide only their predicate evaluator and source-specific pruning; projection,
row-index gathering, vector reconstruction, and limits are shared. This keeps format adapters
small while avoiding a dependency from those packages on the optional scan runtime.

```typescript
import {executeTableScanBatches} from '@loaders.gl/scan';

const result = executeTableScanBatches(
  (signal, onByteLength) => parser.readBatches({signal, onByteLength}),
  {columns: ['id'], limit: 100}
);
```

The package also provides the application-facing query state and metadata vocabulary used by
metadata-driven controls. These are deliberately framework-neutral:

```typescript
import type {ScanQuery, ScanQueryMetadata} from '@loaders.gl/scan';

const query: ScanQuery = {columns: ['name'], limit: 25};
async function discover(source: {getQueryMetadata(): Promise<ScanQueryMetadata>}) {
  return await source.getQueryMetadata();
}
```

`ScanQuery` is a portable control shape. Sources normalize unsupported fields and advertise their
actual capabilities through `ScanQueryMetadata`; no React, GPU, or database dependency is pulled
into applications that only use a format loader.

Metadata also makes the execution conclusion explicit:

```typescript
const metadata = await source.getQueryMetadata();

if (metadata.execution.status === 'supported') {
  console.log(`Execute with source.${metadata.execution.method}()`);
} else {
  console.log(`Discovery only: ${metadata.execution.reason}`);
}
```

A supported table source names `read()` or `query()`, a raster source names `getRaster()`, and a
point-cloud source names `scan()`. Metadata-only sources must supply a user-facing reason. This
keeps query panels and support documentation from inferring readiness from optimization
capabilities: a residual operator is fully supported even though it performs more work, while a
metadata-only source never presents an executable scan.

Point-cloud sources implement `PointCloudScanSource` and can share
`selectPointCloudScanTiles()`. The planner traverses hierarchy nodes in deterministic breadth-first
order, prunes by bounds, level, and spacing, and leaves exact point bounds and attribute predicates
to the physical adapter. COPC and Potree use this contract to emit bounded Arrow batches with one
global limit.

Raster sources implement `getRaster()` and publish raster-specific capabilities independently of
table operators. NetCDF supports numeric variable selection and named dimension index or half-open
range slices. GeoTIFF, OME-TIFF, GeoZarr, and OME-Zarr retain their format-specific window, level,
channel, and chunk planners behind the same metadata vocabulary.

## Ordered append federation

`FederatedTableScanSource` exposes multiple managed table sources as one ordered Arrow stream. It
uses `DataSourceManager` as the authoritative registry and resource owner; federation does not add
a second loader registry, cache, or lifecycle system.

```typescript
import {DataSourceManager} from '@loaders.gl/loader-utils';
import {FederatedTableScanSource, parseSQLPredicate} from '@loaders.gl/scan';

const dataSourceManager = new DataSourceManager();
dataSourceManager.add({dataSourceId: 'current', dataSource: currentSource});
dataSourceManager.add({dataSourceId: 'archive', dataSource: archiveSource});

const history = new FederatedTableScanSource(dataSourceManager, {
  schemaPolicy: 'union',
  sources: [
    {dataSourceId: 'current'},
    {
      dataSourceId: 'archive',
      query: {predicate: parseSQLPredicate('year >= 2020')},
      columnMapping: {station_id: 'stationId'}
    }
  ]
});

for await (const batch of history.read({
  columns: ['stationId', 'temperature'],
  limit: 100
})) {
  console.log(batch.sourceId, batch.data);
}
```

The source list is the stable result order: every surviving row from the first source precedes
every surviving row from the second. Each source may have a source-local predicate, projection,
and limit. Explicit `columnMapping` entries rename physical columns before schemas are compared.
The global predicate and projection run against those mapped names.

Two reconciliation policies are available:

- `strict` (the default) requires every source to expose the same mapped column names and exact
  portable data types. Physical column order may differ.
- `union` creates columns in first-seen order and supplies typed nulls where a source lacks a
  column. A column becomes nullable when it is absent from any source.

Applications that require a stable output contract can provide `outputSchema`. The executor
reorders fields and performs only declared lossless normalization: safe numeric widening,
dictionary-to-value conversion, and Arrow view-to-value conversion. It rejects lossy casts,
implicit string conversion, removal of nullability, and missing required fields during planning.

The caller's limit is global, not per source. Once it is reached, the active iterator is closed and
later sources are not opened. Cancellation is observed during asynchronous source resolution and
between physical batches. Every emitted batch carries `sourceId`, `sourceIndex`, and
`sourceBatchIndex`, while its metadata retains the original physical batch metadata under
`sourceMetadata`.

Metadata discovery, explanation, and reads subscribe to all referenced sources for the duration of
the operation. Their `DataSourceManager` subscriptions are released on success, error,
cancellation, a satisfied limit, or an early consumer return. This preserves the manager's existing
replacement, deferred-id, non-persistent pruning, and lifecycle behavior.

`DataSourceManager.discoverDataSources({queryType: 'table'})` provides picker-safe discovery. It
returns ids, lifecycle state, compatibility, and query metadata, but never exposes the managed
source object. `read({onTelemetry})` reports terminal aggregate and per-source counters including
files and tasks opened, bytes fetched, batches decoded, rows tested and retained, pruning, source
timings, early termination, and cancellation when the physical source can measure them.

Append federation is deliberately not a distributed SQL engine. It does not reorder sources,
parallelize reads, coerce incompatible data types, or join managed sources. It provides one
predictable `UNION ALL`-style scan over sources that already implement `TableScanSource`.

## Addressed vector tables

Specialized tile and service controls stay outside the portable relational query. Applications can
bind one vector tile or one bounded feature request, then expose the resulting Arrow feature table
through the same metadata, explain, and `read()` surface:

```typescript
import {VectorTileTableScanSource} from '@loaders.gl/scan';

const tileTable = new VectorTileTableScanSource(mvtSource, {
  sourceType: 'mvt-tile-table',
  tile: {x: 2, y: 6, z: 4, layers: ['places']}
});

const metadata = await tileTable.getQueryMetadata();
for await (const batch of tileTable.read({
  predicate: parseSQLPredicate('population >= 1000000'),
  columns: ['name', 'population'],
  limit: 25
})) {
  // Arrow feature table batch
}
```

Configure MVT and vector PMTiles sources with `shape: 'arrow-table'`. The corresponding
`VectorFeatureTableScanSource` requests Arrow output from bounded vector sources such as WFS and
ArcGIS FeatureServer. Tile coordinates, selected layers, service bounds, and CRS remain immutable
source parameters; predicates, projection, ordering, aggregates, and limits remain portable query
operators. Both adapters cache the addressed result between metadata discovery and execution, so a
query panel does not repeat the network request.
