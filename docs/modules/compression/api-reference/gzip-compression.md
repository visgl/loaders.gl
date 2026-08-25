# GZipCompression

<p class="badges">
  <img src="https://img.shields.io/badge/Deprecated-v5.0-orange.svg?style=flat-square" alt="Deprecated in v5.0" />
</p>

`GZipCompression` is the combined GZIP compatibility codec. Async methods prefer built-in streams;
the compact `fflate` implementation provides the synchronous and fallback paths.

New code should select a direction-specific `fflate`, Pako, or `compress-utils` adapter from the
[implementation tables](/docs/modules/compression). Compare them in the
[live benchmarks](/docs/modules/compression/benchmarks).

## Interface

Implements the deprecated combined [`Compression`](./compression) API.

## Methods

### `constructor(options?: object)`

- `options.gzip.level` selects a compression level.
- `options.gzip.useNative` disables or enables built-in stream probing.
- The legacy top-level `options.useNative` setting remains supported.
