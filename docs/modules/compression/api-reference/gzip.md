# GZIP Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`GZipCompressor` and `GZipDecompressor` are the recommended GZIP transforms. Their async methods
prefer built-in streams and fall back to compact `fflate`; synchronous and fallback streaming
operations use `fflate` directly.

```typescript
import {GZipCompressor, GZipDecompressor} from '@loaders.gl/compression';

const compressed = await new GZipCompressor().compress(data);
const restored = await new GZipDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `useNative: false` selects the deterministic `fflate` path.
- `gzip.level` selects the fallback compression level.

## Backend choices

Most applications do not need these implementation-specific imports.

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| fflate | `gzip-compressor-fflate` | `gzip-decompressor-fflate` |
| Pako | `gzip-compressor-pako` | `gzip-decompressor-pako` |
| compress-utils | `gzip-compressor-compress-utils` | `gzip-decompressor-compress-utils` |

Compare their measured size and throughput in the [live benchmarks](/docs/modules/compression/benchmarks).
