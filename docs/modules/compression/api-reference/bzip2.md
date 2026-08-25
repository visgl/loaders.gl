# bzip2 Compressor and Decompressor

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`BZip2Compressor` and `BZip2Decompressor` provide asynchronous bzip2 support through direction-
specific `compress-utils` imports. The encoder or decoder is loaded only when that operation runs.

```typescript
import {BZip2Compressor} from '@loaders.gl/compression/bzip2-compressor';
import {BZip2Decompressor} from '@loaders.gl/compression/bzip2-decompressor';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs, including
incremental batch methods. Install the optional `compress-utils` peer dependency.

## Backend choice

The currently supported backend is `compress-utils`, available directly as
`bzip2-compressor-compress-utils` and `bzip2-decompressor-compress-utils`. Direct backend imports
are mainly useful for explicit dependency policies and benchmarks.

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured size and throughput.
