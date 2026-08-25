# Built-in Compression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

The lightweight `@loaders.gl/compression/native-compression` entrypoint exposes the runtime's
`CompressionStream` API without importing a fallback codec. Use it when the smallest initial
bundle matters and dynamically import a selected fallback if it returns `null`.

```typescript
import {compressWithNativeCompressionStream} from '@loaders.gl/compression/native-compression';

async function compressGzip(data: ArrayBuffer): Promise<ArrayBuffer> {
  const builtInOutput = await compressWithNativeCompressionStream(data, 'gzip');
  if (builtInOutput) {
    return builtInOutput;
  }

  const {GZipFflateCompressor} = await import(
    '@loaders.gl/compression/gzip-compressor-fflate'
  );
  return new GZipFflateCompressor().compress(data);
}
```

The helpers accept `gzip`, `deflate`, `brotli`, and `zstd`. Actual support is determined by
the current runtime. A helper returns `null` when `CompressionStream` or the requested format is
unavailable. Once a stream has been created, compression errors are reported to the caller.

## Functions

### `compressWithNativeCompressionStream(input, format)`

Compresses one `ArrayBuffer`. Returns an exactly sized `ArrayBuffer`, or `null` when the format
is unavailable.

### `compressBatchesWithNativeCompressionStream(inputBatches, format)`

Creates an incremental built-in compression stream for iterable or async iterable input. Returns
an async iterable of exactly sized `ArrayBuffer` chunks, or `null` when the format is unavailable.

See [built-in decompression](./native-decompression) for the corresponding decode helpers.
