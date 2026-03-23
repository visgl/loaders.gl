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

| Loader                                                                                      | Description                                     |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)                          | Basis Universal textures as `TextureLevel[][]`  |
| [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) | KTX, DDS and PVR mip chains as `TextureLevel[]` |
| [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)                  | Crunch mip chains as `TextureLevel[]`           |
| [`ImageTextureLoader`](/docs/modules/textures/api-reference/image-texture-loader)           | Manifest-driven single image or mip chain       |
| [`ImageTextureArrayLoader`](/docs/modules/textures/api-reference/image-texture-array-loader) | Manifest-driven texture arrays                  |
| [`ImageTextureCubeLoader`](/docs/modules/textures/api-reference/image-texture-cube-loader)  | Manifest-driven cubemaps                        |
| [`ImageTextureCubeArrayLoader`](/docs/modules/textures/api-reference/image-texture-cube-array-loader) | Manifest-driven cube arrays                     |

## Return Types

The compressed texture loaders in this module return `TextureLevel` objects from `@loaders.gl/schema`.

## Texture Category

A `TextureLevel` describes one mip level of one texture image.

| Field           | Type              | Description                                                                                                                                        |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compressed`    | `boolean`         | Whether the mip level data is GPU-compressed.                                                                                                      |
| `shape`         | `'texture-level'` | Shape tag for normalized texture-level payloads. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />   |
| `format`        | `number`          | WebGL internal format enum for the decoded level. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />  |
| `textureFormat` | `TextureFormat`   | WebGPU / luma.gl style format string for the data. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" /> |
| `data`          | `Uint8Array`      | The bytes for this mip level.                                                                                                                      |
| `width`         | `number`          | Width of this mip level.                                                                                                                           |
| `height`        | `number`          | Height of this mip level.                                                                                                                          |
| `levelSize`     | `number`          | Size in bytes for this mip level, when available.                                                                                                  |
| `hasAlpha`      | `boolean`         | Whether the transcoded texture contains alpha.                                                                                                     |

`BasisLoader` returns `TextureLevel[][]`, preserving all images in a `.basis` or `.ktx2` asset.

`CompressedTextureLoader` returns `TextureLevel[]`.

`CrunchWorkerLoader` returns `TextureLevel[]`.

See [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader) and [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) for loader-specific options and return shapes.

## Composite Image Loaders

The textures module also includes manifest-driven loaders for composite image textures:

- [`ImageTextureLoader`](/docs/modules/textures/api-reference/image-texture-loader) for a single image or mip chain
- [`ImageTextureArrayLoader`](/docs/modules/textures/api-reference/image-texture-array-loader) for texture arrays, including mipmapped layers
- [`ImageTextureCubeLoader`](/docs/modules/textures/api-reference/image-texture-cube-loader) for cubemaps, including mipmapped faces
- [`ImageTextureCubeArrayLoader`](/docs/modules/textures/api-reference/image-texture-cube-array-loader) for cube arrays

These loaders resolve relative member URLs against the manifest URL, or against `options.core.baseUrl` when parsing an in-memory manifest.
Member assets are parsed with `ImageLoader` by default, and additional loaders passed to top-level `load()` are also available for manifest members.

## Attributions

- The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
- The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed).
