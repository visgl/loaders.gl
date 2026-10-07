# LZO1X decoder provenance

Adapted from the decompression state machine in AxioDL/lzokay's `lzokay.cpp`:
https://github.com/AxioDL/lzokay/blob/db2df1fcbebc2ed06c10f727f72567d40f06a2be/lzokay.cpp

Copyright (c) 2018 Jack Andersen; MIT license retained in LICENSE.

The C adaptation uses checked offsets instead of speculative pointers and
unaligned reads. It validates extension lengths, input consumption, end markers,
back-references, and output capacity. A count-only mode supports allocation-free
size probing bounded by the existing decompression limit. No compressor,
dictionary, LZO-RLE variant, lzop container, or application framing is included.

WASM is built from the decoder-only compress-utils fork using Zig 0.16.0 and wasm-opt -Oz --strip-debug. wasm-data.ts embeds the resulting single asset to avoid CDN/file URL dependencies. decode.ts is the checked JavaScript fallback.

compress-utils source: https://github.com/ibgreen/compress-utils/tree/b99ec2c
Upstream PR: https://github.com/dupontcyborg/compress-utils/pull/47

To reproduce with Zig 0.16.0 and CMake available:

```sh
cmake -S bindings/wasm -B build-wasm-lzo --toolchain "$PWD/cmake/toolchains/zig-wasm.cmake" -DCU_WASM_ALGO=lzo -DCMAKE_BUILD_TYPE=Release
cmake --build build-wasm-lzo
wasm-opt bindings/wasm/dist/algorithms/lzo/decompress/lzo.wasm -Oz --strip-debug -o /tmp/lzo.wasm
# From loaders.gl:
node scripts/vendor-lzo-wasm.mjs /tmp/lzo.wasm
yarn lint fix
```

The single 23,372-byte asset has no imported functions and no compression ABI
exports. Its embedded form lets Node and Chromium use the identical bytes.
