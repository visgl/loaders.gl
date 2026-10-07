# LzoDecompressor

Decodes raw LZO1X blocks produced by LZO1X-1 and LZO1X-999. Used by the
JavaScript Parquet reader for LZO pages and by ORC for LZO chunks.

```typescript
import {LzoDecompressor} from '@loaders.gl/compression/lzo-decompressor';

const decoder = new LzoDecompressor();
await decoder.preload();
const bytes = decoder.decompressSync(compressedBlock, outputCapacity);
```

The output capacity is required and must be a non-negative integer. The
returned buffer contains the actual decoded bytes, which may be fewer than
the capacity. `maxOutputSize` defaults to 64 MiB and bounds allocations.

The decoder uses a vendored decoder-only compress-utils WASM implementation
after preload. It uses a synchronous JavaScript fallback before preload or
when WebAssembly compilation is blocked. Set `useWasm: false` to select that
fallback explicitly. The root package export loads the implementation lazily;
preload it before synchronous calls.

Compression, dictionaries, other LZO variants, lzop containers, Hadoop framing
and Avro are not supported. Parquet and ORC loaders handle their own framing. The Parquet adapter also accepts Hadoop-framed LZO pages produced by parquet-java.
No external codec dependency or network asset request is needed.
