# Overview

The `@loaders.gl/basis` module contains a loader for Basis encoded compressed textures (images).

## Installation

```bash
npm install @loaders.gl/basis
npm install @loaders.gl/core
```

## API

| Loader                                                         | Description |
| -------------------------------------------------------------- | ----------- |
| [`BasisLoader`](modules/basis/docs/api-reference/basis-loader) |             |

### Compressed Texture API

A set of functions that can extract information from "unparsed" binary memory representation of certain compressed texture image formats. These functions are intended to be called on raw `ArrayBuffer` data, before the `BasisLoader` parses it and converts it to a parsed image type.

TBA

| Function | Description |
| -------- | ----------- |


## Return Types

The `BasisLoader` returns Array of Array of ArrayBuffer

TODO - Node.js handling - expand to normal image?

See [`BasisLoader`](modules/basis/docs/api-reference/image-loader) for more details on options etc.

## Attributions

- The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
- The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed).
