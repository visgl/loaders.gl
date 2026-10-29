Compression API · DEFLATE

# Keep wrapped and raw DEFLATE distinct.

DeflateCompressor and DeflateDecompressor expose the common DEFLATE path while making the RFC 1950 wrapper and raw RFC 1951 stream an explicit option.

[Compression module](https://loaders.gl/next/docs/modules/compression.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression.md)[Shared codec API](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md)[Live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

The DEFLATE path

## Choose the envelope your receiving format expects.

Default DEFLATE is wrapped. Set raw when the surrounding format carries its own framing, and keep the same compressor/decompressor API around either representation.

01

Default

Wrapped DEFLATE stream

02

Raw mode

raw: true for RFC 1951 blocks

03

Selection

Native stream where supported, compress-utils fallback

04

Control

useNative and deflate.level options

Detailed guide

## DEFLATE implementation reference

The sections below document wrapped and raw modes, options, backend choices, and compatibility guidance.

![From v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

`DeflateCompressor` and `DeflateDecompressor` are the recommended DEFLATE transforms. Async methods prefer built-in streams and fall back to `compress-utils`. Wrapped zlib DEFLATE and raw RFC 1951 DEFLATE remain distinct and interoperable.

```
import {DeflateCompressor, DeflateDecompressor} from '@loaders.gl/compression';



const compressed = await new DeflateCompressor().compress(data);

const restored = await new DeflateDecompressor().decompress(compressed);
```

Both implement the shared [Compressor and Decompressor](https://loaders.gl/next/docs/modules/compression/api-reference/compressor-decompressor.md) APIs.

## Options[​](#options "Direct link to Options")

* `raw: true` selects raw DEFLATE. Raw compression uses `compress-utils`; raw decompression may use a built-in `deflate-raw` stream when available.
* `useNative: false` disables built-in probing.
* `compressUtils.level` selects the fallback compression level.

## Backend choices[​](#backend-choices "Direct link to Backend choices")

| Backend        | Compressor subpath                  | Decompressor subpath                  |
| -------------- | ----------------------------------- | ------------------------------------- |
| fflate         | `deflate-compressor-fflate`         | `deflate-decompressor-fflate`         |
| Pako           | `deflate-compressor-pako`           | `deflate-decompressor-pako`           |
| compress-utils | `deflate-compressor-compress-utils` | `deflate-decompressor-compress-utils` |

Most applications should stay with the defaults. See the [live benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md) when deliberately choosing a backend.

For sync methods, preload first; root callers should use `{useNative: false}` when selecting a WASM implementation for synchronous work.
