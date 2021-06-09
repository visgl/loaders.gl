# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `@loaders.gl/textures` module contains loaders for compressed textures. More specifically it contains loaders and writers for compressed texture **container** formats, including KTX, DDS and PVR. It also supports supercompressed Basis textures.

Note that a texture is more complex than an image. A texture typically has many subimages. A texture can represent a single logical image but can also be a texture cube, a texture array etc representing many logical images. In addition, each "image" typically has many mipmap levels.

In addition, in compressed textures each mipmap image is compressed opaquely into a format that can only be understood by certain GPUs.

Basis encoded textures are super compressed. A more recent addition, they can be efficiently transcoded on the client into actual compressed texture formats appropriate for each device and are therefore quite convenient to use.

## Installation

```bash
npm install @loaders.gl/textures
npm install @loaders.gl/core
```

## API

| Loader                                                            | Description |
| ----------------------------------------------------------------- | ----------- |
| [`BasisLoader`](modules/textures/docs/api-reference/basis-loader) |             |

### Compressed Texture API

A set of functions that can extract information from "unparsed" binary memory representation of certain compressed texture image formats. These functions are intended to be called on raw `ArrayBuffer` data, before the `BasisLoader` parses it and converts it to a parsed image type.

TBA

| Function | Description |
| -------- | ----------- |

## Return Types

The `BasisLoader` returns Array of Array of ArrayBuffer

See [`BasisLoader`](modules/textures/docs/api-reference/image-loader) for more details on options etc.

## Attributions

- The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
- The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed).
