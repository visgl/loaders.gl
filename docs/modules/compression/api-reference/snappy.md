# Snappy Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`SnappyCompressor` and `SnappyDecompressor` use the compact `snappyjs` implementation. Snappy is
not exposed by the browser stream APIs, so the defaults select the small JavaScript codec directly.

```typescript
import {SnappyCompressor, SnappyDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs and support
synchronous one-shot operation.

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| snappyjs | `snappy-compressor-snappyjs` | `snappy-decompressor-snappyjs` |
| hysnappy | — | `snappy-decompressor-hysnappy` |
| compress-utils | `snappy-compressor-compress-utils` | `snappy-decompressor-compress-utils` |

`SnappyHysnappyDecompressor` uses a small embedded WebAssembly decoder. Its asynchronous
`preload()` method instantiates one decoder per JavaScript realm, after which `decompressSync()` is
available. This can be a better fit for formats such as Parquet that decode many independent blocks
and already know each block's uncompressed size.

The default is normally the best size/performance balance. See the
[live benchmarks](/docs/modules/compression/benchmarks) before pinning another backend.
