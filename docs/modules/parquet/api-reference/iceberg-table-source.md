# Iceberg table source

`IcebergTableSource` reads an Apache Iceberg table's metadata and manifest files, selects Parquet
data files, and delegates the actual file reads to `ParquetDatasetSource`.

```ts
import {IcebergTableSource} from '@loaders.gl/parquet/iceberg-table-source';

const source = new IcebergTableSource('https://data.example.com/events/metadata/v12.metadata.json', {
  iceberg: {
    headers: {Authorization: 'Bearer token'}
  },
  core: {
    worker: true
  }
});

for await (const batch of source.scan({
  columns: ['timestamp', 'event_type'],
  predicate: {op: '=', args: [{property: 'event_type'}, 'click']},
  batchSize: 10000
})) {
  consume(batch);
}

await source.close();
```

The root package also exports `IcebergTableSource`, `IcebergScanOptions`, and the Iceberg planning
types. The explicit subpath is useful when applications want to keep table-source code out of a
metadata-only bundle.

## API surface

| Method | Purpose |
| --- | --- |
| `getMetadata(signal?)` | Loads and caches the validated metadata JSON. |
| `getCurrentSnapshot(signal?)` | Returns the snapshot named by `current-snapshot-id`. |
| `getScanPlan(signal?, snapshotId?, snapshotRef?)` | Discovers active Parquet and delete files without opening data files. |
| `getParquetFiles(signal?, snapshotId?, snapshotRef?)` | Returns the data-file portion of a scan plan. |
| `getDeleteFiles(signal?, snapshotId?, snapshotRef?)` | Returns the delete-file portion of a scan plan. |
| `scan(options?)` | Reads selected Parquet files as Arrow batches. |
| `close()` | Aborts pending metadata/manifest work and closes the source. |

The source accepts an explicit metadata JSON URL. It does not perform catalog lookup, refresh a
catalog pointer, commit snapshots, or write Iceberg metadata.

## What is supported

| Capability | Support | Notes |
| --- | --- | --- |
| Iceberg metadata JSON | Supported | Explicit `metadata.json` URL or equivalent fetchable URL. |
| Current snapshot selection | Supported | Used when `snapshotId` is omitted. |
| Named branches and tags | Supported | Pass `snapshotRef` to select a metadata `refs` entry. |
| Explicit snapshot selection | Supported | Pass `snapshotId` to `scan`, `getScanPlan`, or file-discovery methods. |
| Manifest-list discovery | Supported | Relative and absolute locations are resolved against table location. |
| Data manifests | Supported | Active Parquet entries are returned in manifest order. |
| Delete manifests | Supported | Delete files are discovered in `getScanPlan()`; position and equality deletes can be applied opt-in. |
| Parquet projection and predicates | Supported | Delegated to the existing Parquet source. |
| File partition pruning | Supported | Scalar manifest partition values use the shared dataset pruning path. |
| File statistics pruning | Supported | Conservative lower/upper-bound pruning; unknown encodings are retained. |
| Spatial envelope pruning | Supported | Opt-in conservative bounding-box pruning when Iceberg bounds expose a recognized geometry envelope. |
| HTTP range requests | Preserved | Parquet transport and range behavior are unchanged. |
| Workers and cancellation | Preserved | Options and signals continue through the Parquet dataset source. |
| Avro/ORC data files | Not selected | The initial source dispatches Parquet data files only. |

## Planning versus decoding

Iceberg is a table-management layer, not a replacement for Parquet decoding. The source is divided
into two phases:

1. Metadata and manifest planning reads table metadata, selects a snapshot, resolves manifests, and
   applies conservative file-level pruning.
2. Parquet decoding opens only selected `.parquet` files and uses the existing projection, predicate,
   range, worker, Arrow batch, and telemetry paths.

This keeps physical Parquet details out of the Iceberg planner and gives future catalog or table
formats a reusable place to supply file descriptors.

## Inspecting a scan plan

Use `getScanPlan()` when an application needs to inspect the table before reading data:

```ts
const plan = await source.getScanPlan(undefined, 12);

console.log(plan.dataFiles.length);
console.log(plan.deleteFiles.length);
```

Named branches and tags can be selected with `snapshotRef`:

```ts
for await (const batch of source.scan({snapshotRef: 'main'})) {
  consume(batch);
}
```

`snapshotId` and `snapshotRef` are mutually exclusive. The source reads the reference from the
already supplied metadata JSON; it does not contact a catalog to resolve or refresh the reference.

`dataFiles` contains Parquet file locations, sizes, record counts, partition values, and manifest
bounds. `deleteFiles` contains delete-file locations, formats, delete kind, referenced data-file
locations, equality field IDs, and basic metrics. Delete files are deliberately represented as a
plan rather than silently ignored by callers; delete application is a separate phase because it
requires format-specific readers and row-level semantics.

The convenience methods `getParquetFiles()` and `getDeleteFiles()` return the corresponding plan
sections.

## Snapshot selection

The default scan uses `current-snapshot-id` from the supplied metadata JSON. A historical snapshot
can be selected explicitly:

```ts
for await (const batch of source.scan({snapshotId: 11, columns: ['id']})) {
  consume(batch);
}
```

Snapshot selection is read-only. The source does not resolve a catalog pointer, commit changes, or
rewrite metadata files.

## File-level pruning

Partition pruning is applied before a Parquet reader is opened. Predicate pruning uses a conservative
interval test over Iceberg lower and upper bounds, then the same predicate is passed to Parquet for
row-group pruning and exact row filtering.

Bounds are often encoded as Iceberg binary values. Primitive values are decoded when the schema
associated with the selected snapshot supplies an unambiguous type. Unsupported values such as
decimals, complex types, or unknown encodings remain candidates. This may read extra files, but it
must never discard a file that could contain a matching row.

The planner also understands `and`, `or`, comparison, `in`, and null expressions. Negated
expressions and missing statistics are retained conservatively.

## Delete-file status

The current implementation discovers delete manifests and exposes their entries through planning
APIs. Position deletes can be applied explicitly with `applyDeletes: true`:

```ts
for await (const batch of source.scan({applyDeletes: true})) {
  consume(batch);
}
```

Delete application is opt-in because it may materialize filtered Arrow batches. Equality deletes are
resolved through the selected snapshot schema's field IDs, restricted to matching partitions, and
ignored when their sequence is not newer than the data file. If a requested projection omits an
equality column, the source reads that column temporarily and removes it from the returned Arrow
batches.

This boundary is intentional: position deletes require row-position tracking, equality deletes
require field-ID/schema resolution, and both need format-specific readers. None of those concerns
should alter the existing Parquet page and Arrow materialization paths.

## Spatial pruning

Applications can provide a conservative axis-aligned envelope. The source checks recognized
lower/upper geometry bounds before opening Parquet files and keeps files when bounds are absent or
ambiguous:

```ts
for await (const batch of source.scan({
  spatialFilter: {column: 'geometry', bbox: [-122.6, 37.6, -122.2, 37.9]}
})) {
  consume(batch);
}
```

This is file-level pruning only. Exact spatial predicates remain an application or GeoArrow
operation, and unsupported geometry encodings are retained rather than guessed.

## REST Catalog and analytical output

The small `IcebergRestCatalog` adapter loads a table response and returns an
`IcebergTableSource`; it does not become a catalog-wide API or add write operations:

```ts
import {IcebergRestCatalog} from '@loaders.gl/parquet/iceberg-rest-catalog';

const catalog = new IcebergRestCatalog({endpoint: 'https://catalog.example.com'});
const table = await catalog.loadTable({namespace: ['analytics'], table: 'events'});
for await (const batch of table.source.scan()) consume(batch);
```

The adapter accepts the existing `@loaders.gl/loader-utils` `RequestScheduler` for catalog calls.
Use it when catalog metadata requests should share an application's request budget. Parquet data
file ranges continue to use the existing `RangeRequestScheduler`/HTTP transport path; the two
schedulers are intentionally separate because catalog JSON requests and byte-range reads have
different coalescing and validation semantics.

Arrow batches are the stable output boundary. Applications can pass those batches to
`@loaders.gl/geoarrow` for GeoArrow conversion or to their GPU upload layer without making the
Parquet module depend on either heavier consumer package. The scan engine preserves typed arrays,
projection, workers, and range access; GPU representation remains an application-level handoff.

## Options and behavior

`IcebergSourceOptions` combines the existing Parquet dataset/source options with:

| Option | Description |
| --- | --- |
| `iceberg.headers` | Headers sent while fetching metadata and manifest files. |
| `snapshotId` | Per-scan snapshot identifier. |
| `snapshotRef` | Per-scan branch or tag name from metadata `refs`. |
| `columns` | Projected Parquet columns. |
| `predicate` | Serializable columnar predicate used for file, row-group, and row pruning. |
| `fileConcurrency` | Per-scan maximum number of Parquet files read concurrently. |
| `parquetDataset.fileConcurrency` | Default file concurrency for all scans from this source. |
| `signal` | Cancels metadata, manifest, and data-file work. |
| `applyDeletes` | Applies position and Avro equality deletes after decoding; off by default. |

All Parquet options remain under their existing `parquet` namespace. The Iceberg source does not
introduce a second worker protocol or a second range-reader implementation.

## Limitations and roadmap

- The source currently accepts an explicit metadata JSON location; catalog discovery is outside the
  module's scope. `IcebergRestCatalog` provides minimal read-only table loading, not catalog
  configuration, refresh, or write APIs.
- Only Parquet data files are dispatched by `scan()`.
- Delete application is supported only through opt-in `applyDeletes: true`.
- Equality-delete files must currently be Avro files with field IDs resolvable in the selected schema.
- Partition transforms and full partition-spec/schema evolution are not yet interpreted as a query
  planner; raw scalar partition values are preserved where available.
- Decimal, UUID, complex, and other bounds that cannot be compared safely are not used for pruning.

## Delta Lake adapter

`DeltaTableSource` is a deliberately small read-only adapter for Delta tables whose active data is
Parquet. It replays JSON commits through an explicit `delta.version`, then delegates active files
to `ParquetDatasetSource`. Automatic latest-version discovery, deletion vectors, CDC, and writes
remain outside this first adapter so the shared scan substrate does not inherit Delta-specific
transaction semantics prematurely.

The intended extension point for Iceberg is the scan plan: a future planner can select files and
delete files, then dispatch each Parquet data file through `ParquetDatasetSource` without depending
on Parquet page indexes, encodings, Thrift structures, or row-group internals.
