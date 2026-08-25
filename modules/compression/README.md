# @loaders.gl/compression

This module contains compression/decompression "transforms" for loaders.gl, a collection of framework-independent 3D and geospatial loaders (parsers).

For documentation please visit the [website](https://loaders.gl).

The asynchronous compression APIs prefer runtime-native `CompressionStream` and
`DecompressionStream` implementations. Compact JavaScript fallbacks are used
when native support is unavailable; larger codecs such as Brotli, LZ4, and
Zstandard can be injected or loaded lazily. Synchronous methods are available
for codecs with synchronous fallbacks, but native and WASM-backed codecs should
be used through the asynchronous APIs.

For Brotli in runtimes without native support, load the optional
`@loaders.gl/compression/brotli-decode` entrypoint and inject its decoder. This
keeps the fallback out of applications that use native Brotli support.

The package root exports lightweight format metadata such as `gzipCompression`
and `zstdCompression`. Call `preload()` to select built-in support or lazily
load a concrete implementation. Concrete classes are available from their
explicit subpaths, for example `@loaders.gl/compression/gzip-compression`.

From v5, applications select independent compressor and decompressor classes
through exact library subpaths such as
`@loaders.gl/compression/gzip-fflate-compressor`,
`@loaders.gl/compression/gzip-fflate-decompressor`, and
`@loaders.gl/compression/zstd-compress-utils-decompressor`. This makes both the
library and codec direction explicit in the bundle.

`compress-utils` is an optional peer dependency. Its Brotli, bzip2, DEFLATE,
GZIP, LZ4, Snappy, XZ, and Zstandard bindings are loaded from direction-specific
algorithm subpaths and support asynchronous one-shot and incremental operation.
The former combined classes ending in `Compression` remain as deprecated
compatibility facades. They implement both the `Compressor` and `Decompressor`
contracts, while new direction-specific classes expose only the operation they
support.
