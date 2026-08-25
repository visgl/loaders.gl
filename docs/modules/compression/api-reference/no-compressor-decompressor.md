# NoCompressor and NoDecompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`NoCompressor` and `NoDecompressor` are pass-through transforms. They let a pipeline represent an
uncompressed format without a special branch.

```typescript
import {NoCompressor, NoDecompressor} from '@loaders.gl/compression';
```

`compress()`, `compressSync()`, `decompress()`, and `decompressSync()` return the input unchanged.
The classes implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs.

The deprecated combined `NoCompression` class remains available for v5 migration.
