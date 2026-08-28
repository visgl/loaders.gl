# ParquetSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`ParquetSourceLoader` creates a reusable `ParquetSource` for metadata, schema, and selective Arrow
batch access without downloading an entire remote Parquet object. The source uses bounded HTTP byte
ranges, decodes the footer once, and shares the resulting metadata and schema cache across calls and
reads.

## Usage

```ts
import {load} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet';

const abortController = new AbortController();
const source = await load(
  'https://example.com/trips.parquet',
  ParquetSourceLoader,
  {parquet: {headers: {Authorization: 'Bearer token'}}}
);

try {
  const metadata = await source.getMetadata();
  const schema = await source.getSchema();

  for await (const batch of source.read({
    rowGroups: [4, 7, 8],
    columns: ['x', 'y', 'source_id'],
    predicate: {
      op: 'and',
      args: [
        {op: '>=', args: [{property: 'timestamp'}, start]},
        {op: '<', args: [{property: 'timestamp'}, end]}
      ]
    },
    batchSize: 524_288,
    concurrency: 2,
    signal: abortController.signal
  })) {
    console.log(schema, metadata.rowCount, batch.rowOffset, batch.data);
  }
} finally {
  await source.close();
}
```

Both URL and `Blob` inputs are supported. The root loader is metadata-only; async `load()` imports its
runtime implementation from the package's `parquet-source-loader` subpath. File access begins when
`getSchema()`, `getMetadata()`, `getScanPlan()`, or `read()` is first called.

Applications that need synchronous `createDataSource()` can import the runtime loader explicitly:

```ts
import {createDataSource} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';

const source = createDataSource(url, [ParquetSourceLoader], {});
```

## Multi-file datasets

The [Overture GeoParquet browser example](/examples/geospatial/overture-parquet) demonstrates this
API against the live Overture STAC catalog. It discovers the current places release, reads only
selected Parquet byte ranges, streams Arrow batches, and renders them directly with deck.gl.

`ParquetDatasetSource` composes a lazy file provider with one selective `ParquetSource` per selected
file. The provider may be backed by STAC, a database, an application manifest, or a static array;
the Parquet module does not depend on any catalog protocol.

```ts
import {ParquetDatasetSource} from '@loaders.gl/parquet/parquet-dataset-source';
import {STACSource} from '@loaders.gl/stac/stac-source';

const catalog = new STACSource('https://stac.overturemaps.org/catalog.json', {});
const dataset = new ParquetDatasetSource(
  async function* getOvertureFiles(query) {
    for await (const item of catalog.traverse({
      bbox: query.bbox,
      signal: query.signal,
      maxRequests: 500
    })) {
      for (const asset of catalog.getAssets(item, {roles: ['data']})) {
        if (asset.href.endsWith('.parquet')) {
          yield {
            id: `${item.id}/${asset.key}`,
            data: asset.href,
            bbox: item.bbox,
            partitions: {
              theme: String(item.properties.theme),
              type: String(item.properties.type)
            },
            metadata: {stacItemId: item.id}
          };
        }
      }
    }
  },
  {parquetDataset: {fileConcurrency: 4}}
);

for await (const batch of dataset.read({
  bbox: [-71.12, 42.32, -70.98, 42.42],
  partitions: {theme: 'places'},
  columns: ['id', 'names', 'categories', 'geometry'],
  predicate: {op: '=', args: [{property: 'confidence'}, 1]}
})) {
  console.log(batch.datasetFileId, batch.datasetPartitions, batch.data);
}
```

Call `dataset.getScanPlan(options)` to inspect the common logical query, descriptor pruning, and
each retained file's physical Parquet plan before decoding data pages. `dataset.explain(options)`
is an alias, and `dataset.scan(options)` is the common scan-architecture alias for `read(options)`.

The dataset source forwards `bbox`, `partitions`, and `signal` to the provider, then conservatively
rechecks descriptor bounding boxes and known partition values before opening files. Missing
descriptor metadata is never treated as proof that a file cannot match. For files with a valid
GeoParquet 1.1 `bbox` covering, the same `bbox` also creates a hidden nested predicate: footer
statistics prune row groups, column/offset indexes prune pages, and surviving rows are filtered by
exact bounding-box intersection. Files without a supported covering remain conservatively selected.

Selected files decode concurrently, while emitted Arrow batches retain provider order. A one-batch
queue per active file applies backpressure, so deterministic output does not require materializing
later files in memory. Each batch adds `datasetFileIndex`, `datasetFileId`, `datasetPartitions`, and
`datasetFileMetadata` without copying its Arrow buffers. Predicates, projection, batching, range
requests, worker decoding, cancellation, and exact row provenance remain the responsibility of each
child `ParquetSource`.

Static descriptors must be supplied as a reusable array. Streaming or one-shot iterables belong
inside a provider function so every `getSchema()` or `read()` operation receives a fresh collection.
Catalog discovery for later files overlaps decoding and consumption of the first selected file.

Files must expose the same field schema by default. Set `parquetDataset.validateSchema` to `false`
only when the caller intentionally handles heterogeneous Arrow batches. `getTelemetry()` reports
file discovery/pruning counts, emitted rows and batches, and aggregated child-source telemetry.

## API

### `getSchema(options?): Promise<Schema>`

Returns the cached Arrow-compatible loaders.gl schema. Compatible GeoParquet metadata is normalized
to GeoArrow field metadata in the same way as Arrow output from `ParquetLoader`.

### `getMetadata(options?): Promise<ParquetSourceMetadata>`

Returns cached plain JavaScript metadata copied from the Parquet footer:

- file byte length, format version, writer, and row count;
- key/value footer metadata;
- row counts, absolute row offsets, and compressed/uncompressed byte lengths for each row group;
- column path, compression, encodings, value count, physical range, byte lengths, data/dictionary
  page offsets, and optional column/offset index ranges for each column chunk;
- decoded minimum, maximum, null-count, distinct-count, and bound-exactness statistics when
  supplied by the writer;
  and
- `ETag` or `Last-Modified` validators captured from remote objects.

Pass `{formatSpecificMetadata: true}` to include the decoded Parquet Thrift footer. Both metadata and
schema objects are reused for the lifetime of the source.

### `read(options?): AsyncIterable<ParquetSourceBatch>`

Returns Arrow table batches. `rowGroups` controls which row groups are fetched and their output
order. `columns` prevents unselected column chunks from being requested or decoded. Both selections
are validated against the cached footer before row data is read.

Every batch includes provenance as top-level properties and in `batch.metadata`:

| Property | Description |
| --- | --- |
| `sourceId` / `source` | Source URL, file name, or stable Blob label. |
| `sourceUrl` | Source URL when available. |
| `rowGroupIndex` | Zero-based row-group index in the source file. |
| `rowOffset` | Absolute source-row offset of the first batch row. |
| `rowGroupRowOffset` | Offset of the first batch row within the row group. |
| `rowCount` | Number of rows in the batch. |
| `rowGroupRowIndices` | Exact row-group-relative indexes when a predicate produces a non-contiguous batch. |
| `rowIndices` | Exact absolute source-row indexes when a predicate produces a non-contiguous batch. |

Rows are yielded in the requested row-group order even when `concurrency` allows multiple groups to
decode at once. Ending iteration early, aborting `signal`, or calling `close()` cancels outstanding
range requests. Network and decode errors are rethrown by the iterator.

By default in browsers, the source fetches selected compressed column chunks on the caller thread,
then transfers those exact buffers to a dedicated worker. Decompression, page decoding, column
materialization, and Arrow conversion run in that worker. The result uses
`@loaders.gl/arrow`'s direct Arrow table transport: Arrow's underlying buffers are transferred and
the table is hydrated on the caller thread, without serializing the table to Arrow IPC or
constructing an intermediate object for every row. Keeping authenticated range requests on the
caller thread preserves custom fetch implementations, cancellation, range scheduling, and object
version validation.

When a predicate references columns omitted from the output projection, the worker path performs
the same filter-first late materialization as the caller-thread path: predicate columns are decoded
and evaluated first, and projected column ranges are fetched and gathered only for row groups with
matches. The final Arrow table is transferred through the Arrow table utilities and retains exact
row-group indexes and provenance.

Rows fall back to caller-thread decoding when workers are disabled or unavailable. Nested columns
retain their composite values while primitive and logical columns flow through the columnar path.

### `getScanPlan(options?): Promise<ParquetSourceExplain>`

Returns the common logical `scan → filter → project → limit` plan together with the physical
Parquet row-group plan. The physical section reports retained row-group indexes and separate counts
for callback, spatial-statistics, column-statistics, and Bloom-filter pruning. It also reports the
number and byte size of Bloom-filter payloads inspected while planning. For indexed files it also
reports candidate row ranges, selected versus total pages, pruned rows, and the absolute data-page
ranges required by each retained row group. A plan includes `predicate` and `projection` phases
when hidden filter columns require late materialization; the predicate phase contains page-index
ranges for filter columns and the projection phase contains the complete projected column-chunk
ranges actually fetched after matches are known. Planning may therefore read footer, Bloom-filter,
column-index, and offset-index ranges, but it does not decode data pages.

`explain(options)` is an alias for `getScanPlan(options)`. `scan(options)` is an alias for
`read(options)`, allowing `ParquetSource` and `ParquetDatasetSource` to use the same vocabulary as
other common-scan backends.

### `executeScanPlan(plan, options?): AsyncIterable<ParquetSourceBatch>`

Executes a plan returned by `getScanPlan()` while retaining its selected row-group indexes. This is
useful when an application wants to inspect or cache a plan before starting data transfer. Optional
projection, predicate, and limit values override the corresponding logical plan values; the physical
row-group selection remains fixed by the supplied plan.

### Predicate filtering and page pruning

Use the serializable `predicate` option for exact row filtering. Its experimental `op`/`args`
expression shape is directionally aligned with
[CQL2 JSON](https://docs.ogc.org/is/21-065r2/21-065r2.html#cql2-json), but it is only a small
Parquet-focused subset and does not claim CQL2 conformance. Predicates support `=`, `<>`, `<`,
`<=`, `>`, `>=`, `in`, and `isNull`, composed with `and`, `or`, and `not`. Comparison and
membership predicates do not match null column values. A property can be a top-level column name or
an explicit Parquet schema path such as `{property: ['bbox', 'xmin']}`. Filter columns are fetched
automatically, but they are omitted from Arrow output unless they also appear in `columns`.

Before fetching column chunks, the source conservatively applies the predicate to footer min, max,
and null-count statistics. A row group is pruned only when those statistics prove that it cannot
contain a match.

For independently materializable non-repeated leaf columns, including children of structs, the
source then reads available Parquet column indexes and offset indexes. Per-page min/max/null
statistics produce candidate row ranges, and page locations turn those ranges into actual byte
reads for projected and hidden filter columns. Candidate ranges are expanded when columns have
different page boundaries, preventing duplicate or misaligned rows. Missing, malformed, repeated,
or insufficient indexes fall back to complete selected column chunks. Every candidate row is still
evaluated exactly on the caller thread or worker, so page pruning can only improve I/O and cannot
change query results.

### GeoParquet spatial pruning

Pass `bbox` to a `ParquetSource` or `ParquetDatasetSource` read to use the primary geometry
column's native Parquet geospatial statistics, a GeoParquet 1.1 bounding-box covering, or both.
`geometryColumn` selects another geometry column when needed. Native statistics prune whole row
groups before column fetches. A 1.1 covering's `xmin`, `ymin`, `xmax`, and `ymax` paths additionally
become a hidden nested predicate and are omitted from output unless explicitly projected.
The query bbox must use the selected geometry column's coordinate reference system; loaders.gl does
not transform query coordinates during source pruning.

```typescript
for await (const batch of source.read({
  bbox: [-71.12, 42.32, -70.98, 42.42],
  columns: ['id', 'geometry']
})) {
  console.log(batch.rowIndices, batch.data);
}
```

Malformed or missing statistics/coverings fall back conservatively instead of excluding rows.
Native GEOGRAPHY statistics support antimeridian-crossing intervals. A covering proves bounding-box intersection, which is an
exact filter for points and a conservative candidate filter for lines and polygons; applications
requiring geometry-level intersection must still run that spatial operation on the candidates.

```typescript
const batches = source.read({
  columns: ['timestamp', 'value'],
  predicate: {
    op: 'and',
    args: [
      {op: '>=', args: [{property: 'timestamp'}, start]},
      {op: '<', args: [{property: 'timestamp'}, end]},
      {op: 'in', args: [{property: 'status'}, ['valid', 'estimated']]}
    ]
  }
});
```

`rowGroupFilter` remains available for application-specific metadata policies that cannot be
serialized. It runs after `rowGroups` and before automatic predicate pruning.

```typescript
const batches = source.read({
  columns: ['timestamp', 'value'],
  rowGroupFilter: rowGroup => {
    const timestamp = rowGroup.columns.find(column => column.path.join('.') === 'timestamp');
    // Missing or malformed statistics are unknown: retain the row group.
    if (timestamp?.statistics?.min === undefined || timestamp.statistics.max === undefined) {
      return true;
    }
    return timestamp.statistics.max >= start && timestamp.statistics.min < end;
  }
});
```

Callbacks are not transferred to workers and do not perform exact row filtering; use `predicate`
when the returned rows must satisfy a condition.

## Telemetry

`getTelemetry()` returns a cumulative snapshot for the source. `parquet.onTelemetry` additionally
receives snapshots after range requests, cache hits, pruning, decoding, Arrow conversion, batches,
cancellation, and failures. Exceptions thrown by the callback do not interrupt a read.

```typescript
const source = createDataSource(url, [ParquetSourceLoader], {
  parquet: {
    onTelemetry: event => console.log(event.type, event.telemetry)
  }
});

await Array.fromAsync(source.read());
console.log(source.getTelemetry());
```

The frozen snapshot reports exact transport counts and bytes, range-cache hits, cumulative
network/decode/Arrow durations, candidate/pruned/decoded row groups, statistics- and page-index-
pruned groups, index blobs read, data pages read/pruned, rows eliminated before page reads,
predicate rows tested/matched, emitted batches and rows, retries, cancellations, and failures.
`retryCount` remains zero while the source uses its fail-fast range policy.

### `capabilities: ParquetSourceCapabilities`

The source exposes the frozen `PARQUET_SOURCE_CAPABILITIES` descriptor synchronously, before any
network or decoding work starts. It reports support for cached immutable metadata, row-group and
column selection, provenance, cancellation, custom range transport, object-version validation,
statistics-driven row-group and page-index predicate pushdown, exact predicate filtering,
GeoParquet bbox-covering spatial pruning, transport/decode telemetry, package-local assets, and
worker-backed selective decoding.

### `close(): Promise<void>`

Aborts active requests, closes the range-backed file, and permanently closes the source. Calling
`close()` more than once is safe.

## Options

Source defaults are configured under `parquet`; `read()` options override those defaults for an
individual read.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `core.worker` | `boolean` | `true` in browsers | Runs decompression, decoding, materialization, and Arrow conversion in a worker. Unsupported runtimes fall back to the caller thread. |
| `core.reuseWorkers` | `boolean` | `true` in browsers | Reuses selective source workers between row-group jobs. |
| `parquet.headers` | `HeadersInit` | `undefined` | Headers forwarded to all remote Parquet requests. |
| `parquet.preserveBinary` | `boolean` | `false` | Binary-value policy used by TypeScript-backed column reads. |
| `parquet.int96AsTimestamp` | `boolean` | `false` | Decodes legacy INT96 physical values as epoch-nanosecond timestamps in the source schema and batches. |
| `parquet.verifyPageChecksums` | `boolean` | `false` | Verifies CRC-32 page bodies when the file provides page checksums; checksum-enabled reads use the TypeScript path. |
| `parquet.verifyFooterSignature` | `boolean` | `true` | Verifies plaintext-footer signatures on modular-encrypted files when a `keyRetriever` is supplied. |
| `parquet.keyRetriever` | `ParquetKeyRetriever` | `undefined` | Resolves keys for modular-encrypted metadata, indexes, Bloom filters, and pages. |
| `parquet.aadPrefix` | `Uint8Array` | `undefined` | Supplies the AAD prefix for encrypted files that omit it from their crypto metadata. |
| `parquet.onTelemetry` | `(event: ParquetTelemetryEvent) => void` | `undefined` | Receives cumulative transport, pruning, decode, and batch telemetry events. |
| `parquet.workerUrl` | `string` | package-local worker | Overrides the selective source worker URL for explicit asset hosting. |
| `parquet.rowGroups` / `read.rowGroups` | `number[]` | all row groups | Row-group indexes to fetch, in output order. |
| `parquet.columns` / `read.columns` | `string[]` | all columns | Top-level columns to fetch and decode. |
| `parquet.rowGroupFilter` / `read.rowGroupFilter` | `(rowGroup: ParquetRowGroupMetadata) => boolean` | keep all | Retains candidate row groups before their column chunks are fetched. |
| `parquet.predicate` / `read.predicate` | `ParquetPredicate` | `undefined` | Prunes impossible row groups using statistics, then exactly filters decoded rows. |
| `parquet.bbox` / `read.bbox` | `ParquetBoundingBox` | `undefined` | Uses native geospatial statistics and/or a GeoParquet 1.1 covering for conservative spatial pruning. |
| `parquet.geometryColumn` / `read.geometryColumn` | `string` | GeoParquet `primary_column` | Selects the geometry column whose native statistics or bbox covering serves `bbox`. |
| `parquet.batchSize` / `read.batchSize` | `number` | one row group | Maximum rows per emitted batch. |
| `parquet.concurrency` / `read.concurrency` | `number` | `1` | Maximum row groups decoded concurrently. |
| `read.signal` | `AbortSignal` | `undefined` | Cancels this read and its outstanding ranges. |
| `rangeRequests.scheduler` | `RangeRequestScheduler` | per-source scheduler | Reuses a shared loaders.gl range scheduler. |
| `rangeRequests.batchDelayMs` | `number` | `0` | Delay before coalescing queued ranges. |
| `rangeRequests.maxGapBytes` | `number` | `0` | Maximum gap eligible for range coalescing. |
| `rangeRequests.rangeExpansionBytes` | `number` | `0` | Maximum overfetch used to combine nearby ranges. |
| `rangeRequests.maxMergedBytes` | `number` | scheduler default | Maximum size of one merged transport range. |
| `rangeRequests.stats` | `Stats` | scheduler default | probe.gl range-request counters. |
| `rangeRequests.onEvent` | `(event) => void` | `undefined` | Range scheduling diagnostic callback. |

## Package-local WASM

`@loaders.gl/parquet/wasm` exports `PARQUET_WASM_URL`, a bundler-resolvable URL for the packaged
`parquet_wasm_bg.wasm` asset. The raw file is also exported as
`@loaders.gl/parquet/parquet_wasm_bg.wasm` for explicit copy or self-hosting workflows. The current
`ParquetSource` uses the TypeScript range decoder and does not initialize WASM; these entry points
serve the package's WASM loader and writer paths.

## Current limitations

- Range fetching remains on the caller thread so custom fetch implementations and authenticated,
  version-pinned requests do not cross the worker boundary.
- Node.js decodes on the caller thread; the package only prebuilds the browser source worker.
- Page-index range planning supports non-repeated primitive leaves, including struct children;
  repeated selections conservatively use complete selected column chunks.
- Bloom-filter range planning supports uncompressed split-block filters for safe equality and `IN`
  predicates; unsupported or malformed filters are ignored conservatively.
