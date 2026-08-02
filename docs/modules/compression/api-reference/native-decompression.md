# Native Decompression

The lightweight `@loaders.gl/compression/native-decompression` entrypoint exposes async
decompression through the runtime's `DecompressionStream` API without importing fallback codecs.
It supports `gzip`, `deflate`, `deflate-raw`, `brotli`, and forward-compatible `zstd`
constructor probing.
<img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

The helpers return `null` only when `DecompressionStream` or the requested format is unavailable.
After a native stream is created, decompression errors are propagated to the caller.

```typescript
import {
  decompressWithNativeDecompressionStream
} from '@loaders.gl/compression/native-decompression';

async function decompressGzip(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
  const output = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
  if (output) {
    return output;
  }
  const {GZipCompression} = await import('@loaders.gl/compression/gzip-compression');
  return new GZipCompression().decompress(compressedData);
}
```

## Functions

### `decompressWithNativeDecompressionStream(input, format)`

Decompresses one `ArrayBuffer` and returns an exact `ArrayBuffer`, or `null` when the runtime
does not support the requested format.

### `decompressBatchesWithNativeDecompressionStream(inputBatches, format)`

Creates an incremental native decompression stream for iterable or async iterable `ArrayBuffer`
batches. It returns an async iterable of exact `ArrayBuffer` chunks, or `null` when the runtime
does not support the requested format.
