# Built-in Compression and Decompression

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

The default GZIP, DEFLATE, Brotli, and Zstandard classes first ask the runtime for a built-in
`CompressionStream` or `DecompressionStream`. Built-in codecs add no JavaScript codec bytes and
typically offer excellent throughput. Availability varies by format and runtime, so every default
class has a documented fallback.

Most applications should simply use a format default:

```typescript
import {GZipDecompressor} from '@loaders.gl/compression';

const data = await new GZipDecompressor().decompress(compressedData);
```

## Low-level helpers

Applications that want full control over fallback loading can import the lightweight helpers:

```typescript
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

const builtInOutput = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
if (!builtInOutput) {
  const {GZipDecompressor} = await import('@loaders.gl/compression/gzip-decompressor');
  return new GZipDecompressor({useNative: false}).decompress(compressedData);
}
```

| Entry point | One-shot helper | Batch helper |
| --- | --- | --- |
| `native-compression` | `compressWithNativeCompressionStream()` | `compressBatchesWithNativeCompressionStream()` |
| `native-decompression` | `decompressWithNativeDecompressionStream()` | `decompressBatchesWithNativeDecompressionStream()` |

The helpers return `null` when the stream API or exact format is unavailable. Once a stream has
been created, codec or input errors are reported to the caller.

Compression accepts `gzip`, `deflate`, `brotli`, and `zstd`. Decompression additionally accepts
`deflate-raw`. Consult the [live benchmarks](/docs/modules/compression/benchmarks) for the support
detected by the current browser.
