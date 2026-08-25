# Native Decompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

The lightweight `@loaders.gl/compression/native-decompression` entrypoint exposes the runtime's
`DecompressionStream` API without importing a fallback codec. Use it when the smallest initial
bundle matters and dynamically import a selected fallback if it returns `null`.

```typescript
import {
  decompressWithNativeDecompressionStream
} from '@loaders.gl/compression/native-decompression';

async function decompressGzip(compressedData: ArrayBuffer): Promise<ArrayBuffer> {
  const builtInOutput = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
  if (builtInOutput) {
    return builtInOutput;
  }

  const {GZipDecompressor} = await import('@loaders.gl/compression/gzip-decompressor');
  return new GZipDecompressor({useNative: false}).decompress(compressedData);
}
```

The helpers accept `gzip`, `deflate`, `deflate-raw`, `brotli`, and `zstd`. Actual support is
determined by the current runtime. A helper returns `null` when `DecompressionStream` or the
requested format is unavailable. Once a stream has been created, decoding errors are reported to
the caller.

## Functions

### `decompressWithNativeDecompressionStream(input, format)`

Decompresses one `ArrayBuffer` and returns an exact `ArrayBuffer`, or `null` when the runtime
does not support the requested format.

### `decompressBatchesWithNativeDecompressionStream(inputBatches, format)`

Creates an incremental built-in decompression stream for iterable or async iterable input. Returns
an async iterable of exactly sized `ArrayBuffer` chunks, or `null` when the format is unavailable.

See [built-in compression](./native-compression) for the corresponding encode helpers.
