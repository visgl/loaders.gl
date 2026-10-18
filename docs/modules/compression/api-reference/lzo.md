---
title: LzoDecompressor API Reference
---

`LzoDecompressor` decodes raw LZO1X blocks through the decoder-only compress-utils 0.10 WASM asset.
It loads dynamically and exposes no compressor.

```typescript
import {LzoDecompressor} from '@loaders.gl/compression';

const decoder = new LzoDecompressor();
const data = await decoder.decompress(compressedBlock, outputCapacity);

await decoder.preload();
const syncData = decoder.decompressSync(compressedBlock, outputCapacity);
```

For atomic async and sync calls, the optional second argument supplies integer output capacity from 0 to 2,147,483,647. The backend's
output-size limit also applies. Caller-provided capacities default to a 512 MiB limit before WASM allocation; `maxOutputByteLength` can configure that limit. `compressUtils.expectedSize` in constructor options may supply the
capacity instead. Without it, the backend measures the block before decoding; supplying a known
capacity avoids that extra pass. Actual decoded output is also checked against `maxOutputByteLength`.
Returned buffers contain only the actual decoded bytes. Invalid/truncated input,
invalid back-references, and insufficient capacity reject async calls or throw from sync calls.

`preload()` shares concurrent initialization. Sync methods require a completed preload. The direct
`@loaders.gl/compression/lzo-decompressor` and `lzo-decompressor-compress-utils` subpaths expose the
same decoder contract.

This class does not parse lzop containers, dictionaries, or other LZO variants. Parquet and ORC
loaders handle their container framing in TypeScript before passing raw blocks to this decoder.

## Incremental decompression

`decompressBatches()` accepts fragments of one raw LZO1X block and emits decoded bytes before
all input has arrived. No output capacity is required. For example:

```typescript
for await (const bytes of decoder.decompressBatches(compressedBlockChunks)) {
  consumeDecodedBytes(bytes);
}
```

The native decoder retains 64 KiB of history plus undrained input from the current chunk.
Use bounded input chunks. `maxOutputByteLength` bounds the cumulative emitted output and defaults
to 512 MiB. The iterator releases the stream when input ends, an error occurs, or iteration stops.
Previously emitted bytes are provisional until iteration finishes and the LZO end marker is
validated. Concatenated independent blocks and container framing require a separate adapter.
