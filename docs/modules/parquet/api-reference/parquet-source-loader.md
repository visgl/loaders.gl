# ParquetSourceLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`ParquetSourceLoader` creates a reusable `ParquetSource` for selective access to a Parquet file.
The source opens the file lazily, caches its schema and footer metadata, and can stream selected row
groups and columns as Arrow batches without reopening the file for each read.

## Usage

```ts
import {load} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet';

const source = await load(
  'https://example.com/trips.parquet',
  ParquetSourceLoader,
  {}
);

try {
  const metadata = await source.getMetadata();
  console.log(metadata.rowCount, metadata.rowGroups.length);

  for await (const batch of source.read({
    rowGroups: [2, 3],
    columns: ['pickup_longitude', 'pickup_latitude'],
    batchSize: 65_536
  })) {
    console.log(batch.data, batch.metadata);
  }
} finally {
  await source.close();
}
```

Both URL and `Blob` inputs are supported. The root loader is metadata-only; async `load()` imports its
runtime implementation from the package's `parquet-source-loader` subpath. File access and WASM
initialization begin when `getSchema()`, `getMetadata()`, or `read()` is first called.

Applications that need synchronous `createDataSource()` can import the runtime loader explicitly:

```ts
import {createDataSource} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet/parquet-source-loader';

const source = createDataSource(url, [ParquetSourceLoader], {});
```

## API

### `getSchema(): Promise<Schema>`

Returns the cached Arrow-compatible loaders.gl schema. Compatible GeoParquet metadata is normalized
to GeoArrow field metadata in the same way as Arrow output from `ParquetLoader`.

### `getMetadata(): Promise<ParquetSourceMetadata>`

Returns cached, plain JavaScript metadata copied from the Parquet footer:

- `schema`: Arrow-compatible loaders.gl schema.
- `version`: Parquet format version.
- `rowCount`: total file row count.
- `createdBy`: optional writer identifier.
- `keyValueMetadata`: file-level key/value metadata.
- `rowGroups`: row count, absolute source-row offset, compressed and uncompressed size, and column
  chunks for every row group.

Each column chunk includes its nested `path`, optional `filePath`, `fileOffset`, value count,
compression and encoding names, and compressed and uncompressed size. `fileOffset` is a `bigint`.

The returned schema and metadata objects are reused for the lifetime of the source.

### `read(options?: ParquetSourceReadOptions): AsyncIterable<ParquetSourceBatch>`

Streams Arrow batches for the selected row groups and columns. Omitting `rowGroups` reads every row
group in file order. Explicit row-group indexes are read in the supplied order and must be unique and
in range.

Each batch includes provenance in `batch.metadata`:

| Field | Description |
| --- | --- |
| `sourceId` | Resolved URL, file name, or stable Blob label. |
| `rowGroupIndex` | Zero-based source row-group index. |
| `rowOffset` | Absolute offset of the first batch row in the source file. |
| `rowGroupRowOffset` | Offset of the first batch row within its row group. |

### `close(): Promise<void>`

Releases the cached WASM file handle and prevents additional operations. Calling `close()` more than
once is safe. A source supports one active `read()` at a time; finish or cancel that iterator before
starting another read or calling `close()`. Overlapping operations reject instead of waiting behind a
paused consumer.

## Options

Source defaults are configured under `parquet` when the source is created. `read()` accepts the first
four options again and uses them to override the source defaults for that read.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `parquet.rowGroups` | `number[]` | all row groups | Row-group indexes to read. |
| `parquet.columns` | `string[]` | all columns | Column paths to project. |
| `parquet.batchSize` | `number` | backend default | Target number of rows per Arrow batch. |
| `parquet.concurrency` | `number` | backend default | Concurrent reads used by `parquet-wasm`. |
| `parquet.wasmUrl` | `ParquetWasm.InitInput \| Promise<ParquetWasm.InitInput>` | external URL | Overrides the `parquet-wasm` binary location. |

## Current limitations

- Decoding runs on the caller thread; worker-backed decoding and transferable Arrow buffers are not
  implemented yet.
- URL and Blob access use the transport built into `parquet-wasm`. A custom fetch or range-request
  transport, `AbortSignal`, and ETag/Last-Modified consistency checks are not exposed yet. Remote
  reads depend on the server's CORS and byte-range behavior.
- The default WASM binary is loaded from an external URL. Set `parquet.wasmUrl` to self-host the
  binary; a bundler-resolved packaged default is not implemented yet.
- Downloaded-byte, request-count, network-time, and decode-time telemetry are not reported yet.
- Row-group and column-chunk sizes and offsets are available, but min/max/null statistics are not.
