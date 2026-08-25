# NoCompressor and NoDecompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`NoCompressor` and `NoDecompressor` are pass-through transforms. They let a pipeline represent an
uncompressed format without a special branch.

```typescript
import {NoCompressor} from '@loaders.gl/compression/no-compressor';
import {NoDecompressor} from '@loaders.gl/compression/no-decompressor';
```

`compress()`, `compressSync()`, `decompress()`, and `decompressSync()` return the input unchanged.
The classes implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

The deprecated combined `NoCompression` class remains available for v5 migration.
