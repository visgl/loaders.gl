# Zstandard Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`ZstdCompressor` and `ZstdDecompressor` keep the large WASM codec out of the normal decode path.
They try built-in streams first. Compression falls back to lazy `compress-utils`; decompression
falls back to compact synchronous `fzstd`.

```typescript
import {ZstdCompressor, ZstdDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` disables built-in probing.
- `modules['zstd-codec']` injects the optional high-throughput/WASM implementation. Call
  `preload()` before its synchronous methods.

## Backend choices

| Backend | Direction | Subpath |
| --- | --- | --- |
| fzstd | Decompression | `zstd-decompressor-fzstd` |
| zstd-codec | Compression and decompression compatibility | `zstd-zstd-codec` |
| compress-utils | Compression | `zstd-compressor-compress-utils` |
| compress-utils | Decompression | `zstd-decompressor-compress-utils` |

See the [live benchmarks](/docs/modules/compression/benchmarks) for bundle-size and throughput comparisons, plus the status of built-in browser support.
