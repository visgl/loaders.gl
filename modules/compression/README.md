# @loaders.gl/compression

Lossless compression and decompression for loaders.gl, with a bundle-conscious choice of built-in,
compact JavaScript, and optional codec implementations.

## Design

- Async codecs prefer the runtime's `CompressionStream` and `DecompressionStream` support.
- Library-neutral root classes provide the recommended lazy, balanced default.
- Advanced implementation-specific subpaths use `FORMAT-DIRECTION-IMPLEMENTATION` order.
- Compact `fflate`, `fzstd`, Snappy, LZ4 block, and Brotli fallbacks cover common read paths.
- Larger or specialized implementations are selected through explicit, independently importable
  subpaths.
- Combined classes ending in `Compression` remain available as deprecated v5 compatibility
  facades and implement both the `Compressor` and `Decompressor` interfaces.

## Example

```typescript
import {GZipDecompressor} from '@loaders.gl/compression';

const decompressor = new GZipDecompressor();
const data = await decompressor.decompress(compressedData);
```

For the smallest initial browser bundle, probe a built-in codec and dynamically import a fallback:

```typescript
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

const builtInOutput = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
```

See the [compression module documentation](https://loaders.gl/docs/modules/compression) for the
implementation guide, API reference, migration notes, and live browser benchmarks.
