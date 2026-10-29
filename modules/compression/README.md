# @loaders.gl/compression

Lossless compression and decompression codecs for loaders.gl.

Supported formats: DEFLATE, zlib, GZIP, Brotli, Snappy, LZ4, LZO, BZip2, XZ, LZMA, Zstandard, Zstd.

Lossless compression and decompression for loaders.gl, with a bundle-conscious choice of built-in,
compact JavaScript, and optional codec implementations.

## Design

- Async codecs prefer the runtime's `CompressionStream` and `DecompressionStream` support.
- Library-neutral root classes provide the recommended lazy, balanced default.
- Advanced implementation-specific subpaths use `FORMAT-DIRECTION-IMPLEMENTATION` order.
- All default fallback codecs use lazily imported compress-utils 0.10 WASM subpaths.
- Sync methods require preload; raw LZO1X decoding requires an output capacity.
- Larger or specialized implementations are selected through explicit, independently importable
  subpaths.
- The package root exports only direction-specific APIs and loads JavaScript fallbacks dynamically.
  Use ESM code splitting to keep fallback chunks out of the initial bundle.
- Legacy combined classes remain available only through explicit implementation subpaths.

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

### Internal Deflate engine

The GZIP, zlib, and raw DEFLATE JavaScript paths use an internal TypeScript
fork of fflate 0.7.4. Existing `*Fflate*` classes and subpaths keep their names
and options. The original fflate package is a development reference for parity
tests and benchmarks; these production paths do not import it. Native stream
selection and optional Pako adapters remain available.

See [compression benchmarks](https://loaders.gl/docs/modules/compression/benchmarks)
for a live internal-versus-upstream comparison.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
