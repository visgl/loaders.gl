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
| [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader) |             |


## Return Types

The `BasisLoader` returns Array of Array of ArrayBuffer

See [`BasisLoader`](/docs/modules/images/api-reference/image-loader) for more details on options etc.


## Texture APIs

The textures API offers functions to load "composite" images for WebGL textures, cube textures and image mip levels.

These functions take a `getUrl` parameter that enables the app to supply the url for each "sub-image", and return a single promise enabling applications to for instance load all the faces of a cube texture, with one image for each mip level for each face in a single async operation.

| Function                                                               | Description                                                                                                           |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [`loadImage`](/docs/modules/textures/api-reference/load-image)            | Load a single image                                                                                                   |
| [`loadImageArray`](/docs/modules/textures/api-reference/load-image-array) | Load an array of images, e.g. for a `Texture2DArray` or `Texture3D`                                                   |
| [`loadImageCube`](/docs/modules/textures/api-reference/load-image-cube)   | Load a map of 6 images for the faces of a cube map, or a map of 6 arrays of images for the mip levels of the 6 faces. |

As with all loaders.gl functions, while these functions are intended for use in WebGL applications, they do not call any WebGL functions, and do not actually create any WebGL textures..

## Attributions

- The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
- The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed).
