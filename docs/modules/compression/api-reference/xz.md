# XZ Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`XZCompressor` and `XZDecompressor` provide asynchronous XZ/LZMA support through direction-specific
`compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```typescript
import {XZCompressor, XZDecompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs, including
incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice

The currently supported backend is `compress-utils`, available directly as
`xz-compressor-compress-utils` and `xz-decompressor-compress-utils`. Most applications should use
the library-neutral defaults.

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured size and throughput.
