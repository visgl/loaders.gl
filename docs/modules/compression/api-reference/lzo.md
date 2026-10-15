---
title: LzoDecompressor API Reference
---

`LzoDecompressor` decodes raw LZO1X blocks through the decoder-only compress-utils 0.9 WASM asset.
It loads dynamically and exposes no compressor.

```typescript
import {LzoDecompressor} from '@loaders.gl/compression';

const decoder = new LzoDecompressor();
const data = await decoder.decompress(compressedBlock, outputCapacity);

await decoder.preload();
const syncData = decoder.decompressSync(compressedBlock, outputCapacity);
```

The second argument is a required integer output capacity from 0 to 2,147,483,647. The backend's
output-size limit also applies. Caller-provided capacities default to a 512 MiB limit before WASM allocation; `maxOutputByteLength` can configure that limit. `compressUtils.expectedSize` in constructor options may supply the
capacity instead. Returned buffers contain only the actual decoded bytes. Invalid/truncated input,
invalid back-references, and insufficient capacity reject async calls or throw from sync calls.

`preload()` shares concurrent initialization. Sync methods require a completed preload. The direct
`@loaders.gl/compression/lzo-decompressor` and `lzo-decompressor-compress-utils` subpaths expose the
same decoder contract.

This class does not parse lzop containers, dictionaries, or other LZO variants. Parquet and ORC
loaders handle their container framing in TypeScript before passing raw blocks to this decoder.
