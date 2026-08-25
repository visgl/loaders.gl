# DEFLATE Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`DeflateCompressor` and `DeflateDecompressor` are the recommended DEFLATE transforms. Async methods
prefer built-in streams and fall back to `fflate`. Wrapped zlib DEFLATE and raw RFC 1951 DEFLATE
remain distinct and interoperable.

```typescript
import {DeflateCompressor} from '@loaders.gl/compression/deflate-compressor';
import {DeflateDecompressor} from '@loaders.gl/compression/deflate-decompressor';

const compressed = await new DeflateCompressor().compress(data);
const restored = await new DeflateDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

## Options

- `raw: true` selects raw DEFLATE. Raw compression uses `fflate`; raw decompression may use a
  built-in `deflate-raw` stream when available.
- `useNative: false` disables built-in probing.
- `deflate.level` selects the fallback compression level.

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| fflate | `deflate-compressor-fflate` | `deflate-decompressor-fflate` |
| Pako | `deflate-compressor-pako` | `deflate-decompressor-pako` |
| compress-utils | `deflate-compressor-compress-utils` | `deflate-decompressor-compress-utils` |

Most applications should stay with the defaults. See the [live benchmarks](/docs/modules/compression/benchmarks) when deliberately choosing a backend.
