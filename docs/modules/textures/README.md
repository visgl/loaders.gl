# Overview

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `@loaders.gl/textures` module contains loaders for compressed textures. More specifically it contains loaders and writers for compressed texture **container** formats, including KTX, DDS and PVR. It also supports supercompressed Basis textures and decoded Radiance HDR images.

See [Texture Loaders](/docs/specifications/category-texture) for the shared category conventions.

Note that a texture is more complex than an image. A texture typically has many subimages. A texture can represent a single logical image but can also be a texture cube, a texture array etc representing many logical images. In addition, each "image" typically has many mipmap levels.

In addition, in compressed textures each mipmap image is compressed opaquely into a format that can only be understood by certain GPUs.

Basis encoded textures are super compressed. A more recent addition, they can be efficiently transcoded on the client into actual compressed texture formats appropriate for each device and are therefore quite convenient to use.

## Installation

```bash
npm install @loaders.gl/textures
npm install @loaders.gl/core
```

## Formats

The `@loaders.gl/textures` module handles the following formats:

| Format                                                                      | Description                                                                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures) | Overview of GPU texture container and compression formats                                                                                               |
| [`KTX / KTX2`](/docs/modules/textures/formats/ktx)                          | Khronos texture container formats for mipmapped textures                                                                                                |
| [`DDS`](/docs/modules/textures/formats/dds)                                 | Microsoft DirectDraw Surface texture container                                                                                                          |
| [`PVR`](/docs/modules/textures/formats/pvr)                                 | PowerVR texture container format                                                                                                                        |
| [`Basis Universal`](/docs/modules/textures/formats/basis)                   | Supercompressed texture format for runtime transcoding                                                                                                  |
| [`Crunch`](/docs/modules/textures/formats/crunch)                           | Lossy compressed texture distribution format for GPU textures                                                                                           |
| [`Radiance HDR`](/docs/modules/textures/formats/hdr)                        | High-dynamic-range RGBE textures stored in `.hdr` files <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" /> |

## API

| Loader                                                                                      | Description                                                                                                                               |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)                          | Basis Universal textures as `TextureLevel[][]`                                                                                            |
| [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) | KTX, DDS and PVR mip chains as `TextureLevel[]`                                                                                           |
| [`RadianceHDRLoader`](/docs/modules/textures/api-reference/radiance-hdr-loader)             | Radiance `.hdr` textures as `Texture` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />     |
| [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)                  | Crunch mip chains as `TextureLevel[]`                                                                                                     |
| [`TextureLoader`](/docs/modules/textures/api-reference/texture-loader)                      | Manifest-driven single image or mip chain <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" /> |
| [`TextureArrayLoader`](/docs/modules/textures/api-reference/texture-array-loader)           | Manifest-driven texture arrays <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />            |
| [`TextureCubeLoader`](/docs/modules/textures/api-reference/texture-cube-loader)             | Manifest-driven cubemaps <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />                  |
| [`TextureCubeArrayLoader`](/docs/modules/textures/api-reference/texture-cube-array-loader)  | Manifest-driven cube arrays <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />               |

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
| `data`          | `TypedArray`      | The payload for this mip level. Compressed texture loaders return `Uint8Array`; `RadianceHDRLoader` returns `Float32Array`.                        |
| `width`         | `number`          | Width of this mip level.                                                                                                                           |
| `height`        | `number`          | Height of this mip level.                                                                                                                          |
| `levelSize`     | `number`          | Size in bytes for this mip level, when available.                                                                                                  |
| `hasAlpha`      | `boolean`         | Whether the transcoded texture contains alpha.                                                                                                     |

`BasisLoader` returns `TextureLevel[][]`, preserving all images in a `.basis` or `.ktx2` asset.

`CompressedTextureLoader` returns `TextureLevel[]`.

`RadianceHDRLoader` returns a `Texture` with `shape: 'texture'`, `type: '2d'`, one decoded `rgba32float` level in `data`, and optional application-facing metadata.

`CrunchWorkerLoader` returns `TextureLevel[]`.

See [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader) and [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) for loader-specific options and return shapes.

## Composite Image Loaders

The textures module also includes manifest-driven loaders for composite image textures:

- [`TextureLoader`](/docs/modules/textures/api-reference/texture-loader) for a single image or mip chain <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`TextureArrayLoader`](/docs/modules/textures/api-reference/texture-array-loader) for texture arrays, including mipmapped layers <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`TextureCubeLoader`](/docs/modules/textures/api-reference/texture-cube-loader) for cubemaps, including mipmapped faces <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
- [`TextureCubeArrayLoader`](/docs/modules/textures/api-reference/texture-cube-array-loader) for cube arrays <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

These loaders resolve relative member URLs against the manifest URL, or against `options.core.baseUrl` when parsing an in-memory manifest.
Member assets are parsed with `ImageBitmapLoader` by default.
They return schema `Texture` objects rather than raw image trees.

## Attributions

- The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
- The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed).
