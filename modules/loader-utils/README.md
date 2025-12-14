# @loaders.gl/loader-utils

This module contains shared utilities for loaders.gl, a collection of framework-independent 3D and geospatial loaders (parsers).

For documentation please visit the [website](https://loaders.gl).

## Binary iterator utilities

`@loaders.gl/loader-utils` includes helpers such as `concatenateArrayBuffersAsync` that operate
over `ArrayBuffer`, `ArrayBufferView`, and `ArrayBufferLike` inputs (including `SharedArrayBuffer`).
These utilities make it easy to normalize streamed binary data before handing it off to loaders.
