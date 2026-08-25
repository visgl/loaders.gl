# LZ4 Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`LZ4Compressor` writes LZ4 frames with lazy `lz4js`. `LZ4Decompressor` preserves loaders.gl's
compact hand-written block and Hadoop decoder and loads `lz4js` only when frame decoding requires
it.

```typescript
import {LZ4Compressor} from '@loaders.gl/compression/lz4-compressor';
import {LZ4Decompressor} from '@loaders.gl/compression/lz4-decompressor';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs. Raw block
decompression may require the expected uncompressed size as the second argument.

## Supported layouts

- LZ4 frames
- Raw LZ4 blocks
- Legacy Hadoop-framed LZ4 blocks

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| lz4js | `lz4-compressor-lz4js` | `lz4-decompressor-lz4js` |
| compress-utils | `lz4-compressor-compress-utils` | `lz4-decompressor-compress-utils` |

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured frame performance.
