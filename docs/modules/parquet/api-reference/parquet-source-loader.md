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
`getSchema()`, `getMetadata()`, or `read()` is first called.

Applications that need synchronous `createDataSource()` can import the runtime loader explicitly:

```ts
import {createDataSource} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';

const source = createDataSource(url, [ParquetSourceLoader], {});
```

## API

### `getSchema(options?): Promise<Schema>`

Returns the cached Arrow-compatible loaders.gl schema. Compatible GeoParquet metadata is normalized
to GeoArrow field metadata in the same way as Arrow output from `ParquetLoader`.

### `getMetadata(options?): Promise<ParquetSourceMetadata>`

Returns cached plain JavaScript metadata copied from the Parquet footer:

- file byte length, format version, writer, and row count;
- key/value footer metadata;
- row counts, absolute row offsets, and compressed/uncompressed byte lengths for each row group;
- column path, compression, encodings, value count, physical range, byte lengths, and page offsets
  for each column chunk;
- decoded minimum, maximum, null-count, and distinct-count statistics when supplied by the writer;
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

Rows are yielded in the requested row-group order even when `concurrency` allows multiple groups to
decode at once. Ending iteration early, aborting `signal`, or calling `close()` cancels outstanding
range requests. Network and decode errors are rethrown by the iterator.

The source materializes selected Parquet columns directly and converts those columns into typed
Arrow batches. It does not construct an intermediate object for every row. Nested columns retain
their composite values while primitive and logical columns flow through the columnar path.

### Row-group pruning

Use `rowGroupFilter` to remove candidate row groups using the normalized footer statistics before
any selected column chunk is fetched. The filter runs after `rowGroups`, so explicit selection and
statistics pruning can be combined.

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

Statistics are optional because Parquet writers are not required to emit them. A safe predicate
retains a row group whenever the statistics required to prove exclusion are absent.

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
network/decode/Arrow durations, candidate/pruned/decoded row groups, emitted batches and rows,
retries, cancellations, and failures. `retryCount` remains zero while the source uses its fail-fast
range policy.

### `capabilities: ParquetSourceCapabilities`

The source exposes the frozen `PARQUET_SOURCE_CAPABILITIES` descriptor synchronously, before any
network or decoding work starts. It reports support for cached immutable metadata, row-group and
column selection, provenance, cancellation, custom range transport, object-version validation,
statistics, transport/decode telemetry, and package-local WASM delivery. Source worker decoding is
the remaining deferred capability.

### `close(): Promise<void>`

Aborts active requests, closes the range-backed file, and permanently closes the source. Calling
`close()` more than once is safe.

## Options

Source defaults are configured under `parquet`; `read()` options override those defaults for an
individual read.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `parquet.headers` | `HeadersInit` | `undefined` | Headers forwarded to all remote Parquet requests. |
| `parquet.preserveBinary` | `boolean` | `false` | Binary-value policy used by TypeScript-backed column reads. |
| `parquet.onTelemetry` | `(event: ParquetTelemetryEvent) => void` | `undefined` | Receives cumulative transport, pruning, decode, and batch telemetry events. |
| `parquet.rowGroups` / `read.rowGroups` | `number[]` | all row groups | Row-group indexes to fetch, in output order. |
| `parquet.columns` / `read.columns` | `string[]` | all columns | Top-level columns to fetch and decode. |
| `parquet.rowGroupFilter` / `read.rowGroupFilter` | `(rowGroup: ParquetRowGroupMetadata) => boolean` | keep all | Retains candidate row groups before their column chunks are fetched. |
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

- Decoding runs on the caller thread; worker-backed decoding and transferable Arrow buffers are not
  implemented yet.
