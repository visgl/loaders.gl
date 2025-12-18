# @loaders.gl/core

This module contains shared utilities for loaders.gl, a collection of framework-independent 3D and geospatial loaders (parsers).

For documentation please visit the [website](https://loaders.gl).

Key utilities such as `getArrayBufferOrStringFromDataSync` and `getAsyncIterableFromData` support
`ArrayBuffer`, `ArrayBufferView`, and `ArrayBufferLike` inputs, preserving view offsets when
normalizing loader data.
