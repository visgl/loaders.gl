import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# ParquetSourceLoader

<ParquetDocsTabs active="parquetsource" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`ParquetSourceLoader` creates a reusable `ParquetSource` for metadata and schema access without downloading an entire remote Parquet object. The source opens a URL with bounded HTTP byte ranges, decodes the footer once, and shares the resulting metadata and schema cache across calls.

## Usage

```typescript
import {createDataSource} from '@loaders.gl/core';
import {ParquetSourceLoader} from '@loaders.gl/parquet';

const source = createDataSource(url, [ParquetSourceLoader], {
  core: {
    type: 'parquet',
    loadOptions: {
      core: {fetch: authenticatedFetch}
    }
  },
  parquet: {
    headers: {Authorization: 'Bearer token'}
  }
});

const metadata = await source.getMetadata();
const schema = await source.getSchema();

await source.close();
```

`Blob` and `File` inputs use local slices. URL inputs require a server that honors a single `Range` request with status `206` and a valid `Content-Range` header. A `200` full-object fallback is rejected to prevent an accidental complete download.

## Metadata

`getMetadata()` returns normalized dataset, row-group, and column-chunk metadata:

- file byte length, format version, writer, and row count
- key/value footer metadata
- row counts and compressed/uncompressed byte lengths for each row group
- column path, compression, value count, byte lengths, and page offsets for each column chunk
- `ETag` or `Last-Modified` validators captured from remote objects

Pass `{formatSpecificMetadata: true}` to include the decoded Parquet thrift footer.

```typescript
const metadata = await source.getMetadata({
  formatSpecificMetadata: true,
  signal: abortController.signal
});
```

`getSchema()` returns the same loaders.gl `Schema` representation used by the TypeScript Parquet loader, including GeoParquet metadata normalization.

## Consistency and lifecycle

The first remote range captures object validators. Later ranges send `If-Match` or `If-Unmodified-Since` and reject inconsistent responses, preventing a schema/footer assembled from different object versions.

Both `getMetadata()` and `getSchema()` share one initialization promise. Call `close()` to abort active requests, clear range state, and permanently close the source.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `parquet.headers` | `HeadersInit` | `undefined` | Headers forwarded to all remote Parquet requests. |
| `parquet.preserveBinary` | `boolean` | `false` | Binary-value policy retained for later TypeScript-backed row reads. |
| `rangeRequests.scheduler` | `RangeRequestScheduler` | per-source scheduler | Reuses a shared loaders.gl range scheduler. |
| `rangeRequests.batchDelayMs` | `number` | `0` | Delay before coalescing queued ranges. |
| `rangeRequests.maxGapBytes` | `number` | scheduler default | Maximum gap eligible for range coalescing. |
| `rangeRequests.rangeExpansionBytes` | `number` | scheduler default | Maximum overfetch used to combine nearby ranges. |
| `rangeRequests.maxMergedBytes` | `number` | scheduler default | Maximum size of one merged transport range. |
| `rangeRequests.stats` | `Stats` | scheduler default | probe.gl range-request counters. |
| `rangeRequests.onEvent` | `(event) => void` | `undefined` | Range scheduling diagnostic callback. |

The source also honors `core.loadOptions`, including loaders.gl's custom `core.fetch` and fetch options.
