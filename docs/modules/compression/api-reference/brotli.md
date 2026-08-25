# Brotli Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`BrotliCompressor` and `BrotliDecompressor` provide the balanced Brotli policy. Both try a built-in
stream first. Compression then lazily loads `compress-utils`; decompression lazily loads the compact
loaders.gl JavaScript decoder. Nothing is loaded for a fallback that is not used.

```typescript
import {BrotliCompressor} from '@loaders.gl/compression/brotli-compressor';
import {BrotliDecompressor} from '@loaders.gl/compression/brotli-decompressor';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` skips built-in stream probing.
- `modules.brotli` injects an application-selected implementation.
- `brotli.useZlib` enables Node's built-in `zlib` path.

## Backend choices

| Backend | Direction | Subpath |
| --- | --- | --- |
| loaders.gl decoder shim | Decompression | `brotli-decompressor-shim` |
| compress-utils | Compression | `brotli-compressor-compress-utils` |
| compress-utils | Decompression | `brotli-decompressor-compress-utils` |

Built-in Brotli availability is runtime-dependent. The [live benchmarks](/docs/modules/compression/benchmarks) show what the current browser supports.
