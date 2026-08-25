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
| compress-utils | `snappy-compressor-compress-utils` | `snappy-decompressor-compress-utils` |

The default is normally the best size/performance balance. See the [live benchmarks](/docs/modules/compression/benchmarks) before pinning another backend.
