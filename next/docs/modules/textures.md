Texture module

GPU

# @loaders.gl/textures

Ship one texture asset and choose the GPU format at runtime. Handle containers, mip chains, arrays, cube maps, and Basis Universal transcoding on the client.

[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)[Basis format](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

GPU[Overview](https://loaders.gl/next/docs/modules/textures.md)

Portable texture delivery

## Package once. Choose the GPU target at runtime.

Containers preserve dimensions and mip levels; portable payloads delay the final format choice until the application knows what the current device supports.

Distributed asset

[**KTX2**container and mip chain↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[**Basis**portable supercompression↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[**DDS / PVR**native GPU payloads↗](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)

inspec&#x74;**→**

GPU?

Runtime choice

mipsdevicetranscode

metadata · levels · capabilities

uploa&#x64;**→**

Renderer receives

**BC / S3TC**desktop GPU target

**ETC2 / ASTC**mobile GPU target

**Fallback pixels**when compression is unavailable

The application keeps one asset pipeline while the renderer receives the representation its WebGL or WebGPU device can use efficiently.

Container, payload, device

## Keep texture delivery separate from texture use.

A source file can carry mip levels and a portable compressed payload. The application can inspect that metadata, select a target, and hand the resulting levels to its rendering layer.

01

Containers

KTX, KTX2, DDS, PVR, Basis, and Crunch

02

Layouts

Mips, arrays, cube maps, and 3D texture images

03

Transcode

Basis payloads to device-compatible compressed formats

04

Return

TextureLevel data or normalized texture objects

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The `@loaders.gl/textures` module contains loaders for compressed textures. More specifically it contains loaders and writers for compressed texture **container** formats, including KTX, DDS and PVR. It also supports supercompressed Basis textures and decoded Radiance HDR images.

See [Texture Loaders](https://loaders.gl/next/docs/specifications/category-texture.md) for the shared category conventions.

Detailed guide

## Texture module details

The sections below cover formats, loaders, writers, normalized return shapes, and runtime selection.

Note that a texture is more complex than an image. A texture typically has many subimages. A texture can represent a single logical image but can also be a texture cube, a texture array etc representing many logical images. In addition, each "image" typically has many mipmap levels.

In addition, in compressed textures each mipmap image is compressed opaquely into a format that can only be understood by certain GPUs.

Basis encoded textures are super compressed. A more recent addition, they can be efficiently transcoded on the client into actual compressed texture formats appropriate for each device and are therefore quite convenient to use.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/textures
```

## Formats[​](#formats "Direct link to Formats")

The `@loaders.gl/textures` module handles the following formats:

| Format                                                                                                     | Description                                                   |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md) | Overview of GPU texture container and compression formats     |
| [`KTX / KTX2`](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)                          | Khronos texture container formats for mipmapped textures      |
| [`DDS`](https://loaders.gl/next/docs/modules/textures/formats/dds.md)                                 | Microsoft DirectDraw Surface texture container                |
| [`PVR`](https://loaders.gl/next/docs/modules/textures/formats/pvr.md)                                 | PowerVR texture container format                              |
| [`Basis Universal`](https://loaders.gl/next/docs/modules/textures/formats/basis.md)                   | Supercompressed texture format for runtime transcoding        |
| [`Crunch`](https://loaders.gl/next/docs/modules/textures/formats/crunch.md)                           | Lossy compressed texture distribution format for GPU textures |
| [`Radiance HDR`](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)                        | High-dynamic-range RGBE textures stored in `.hdr` files       |

## API[​](#api "Direct link to API")

| Loader                                                                                                                     | Description                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)                          | Basis Universal textures as `TextureLevel[][]`  |
| [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md) | KTX, DDS and PVR mip chains as `TextureLevel[]` |
| [`RadianceHDRLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/radiance-hdr-loader.md)             | Radiance `.hdr` textures as `Texture`           |
| [`CrunchWorkerLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)                  | Crunch mip chains as `TextureLevel[]`           |
| [`TextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-loader.md)                      | Manifest-driven single image or mip chain       |
| [`TextureArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-array-loader.md)           | Manifest-driven texture arrays                  |
| [`TextureCubeLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)             | Manifest-driven cubemaps                        |
| [`TextureCubeArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-array-loader.md)  | Manifest-driven cube arrays                     |

## Return Types[​](#return-types "Direct link to Return Types")

The compressed texture loaders in this module return `TextureLevel` objects from `@loaders.gl/core/schema`.

## Texture Category[​](#texture-category "Direct link to Texture Category")

A `TextureLevel` describes one mip level of one texture image.

| Field           | Type              | Description                                                                                                                 |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `compressed`    | `boolean`         | Whether the mip level data is GPU-compressed.                                                                               |
| `shape`         | `'texture-level'` | Shape tag for normalized texture-level payloads.                                                                            |
| `format`        | `number`          | WebGL internal format enum for the decoded level.                                                                           |
| `textureFormat` | `TextureFormat`   | WebGPU / luma.gl style format string for the data.                                                                          |
| `data`          | `TypedArray`      | The payload for this mip level. Compressed texture loaders return `Uint8Array`; `RadianceHDRLoader` returns `Float32Array`. |
| `width`         | `number`          | Width of this mip level.                                                                                                    |
| `height`        | `number`          | Height of this mip level.                                                                                                   |
| `levelSize`     | `number`          | Size in bytes for this mip level, when available.                                                                           |
| `hasAlpha`      | `boolean`         | Whether the transcoded texture contains alpha.                                                                              |

`BasisLoader` returns `TextureLevel[][]`, preserving all images in a `.basis` or `.ktx2` asset.

`CompressedTextureLoader` returns `TextureLevel[]`.

`RadianceHDRLoader` returns a `Texture` with `shape: 'texture'`, `type: '2d'`, one decoded `rgba32float` level in `data`, and optional application-facing metadata.

`CrunchWorkerLoader` returns `TextureLevel[]`.

See [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md) and [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md) for loader-specific options and return shapes.

## Composite Image Loaders[​](#composite-image-loaders "Direct link to Composite Image Loaders")

The textures module also includes manifest-driven loaders for composite image textures:

* [`TextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-loader.md) for a single image or mip chain
* [`TextureArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-array-loader.md) for texture arrays, including mipmapped layers
* [`TextureCubeLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md) for cubemaps, including mipmapped faces
* [`TextureCubeArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-array-loader.md) for cube arrays

These loaders resolve relative member URLs against the manifest URL, or against `options.core.baseUrl` when parsing an in-memory manifest. Member assets are parsed with `ImageBitmapLoader` by default. They return schema `Texture` objects rather than raw image trees.

## Attributions[​](#attributions "Direct link to Attributions")

* The `CompressedTextureLoader` was forked from [PicoGL](https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js), Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)
* The `CompressedTextureWriter` is a wrapper around @TimvanScherpenzeel's [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) utility (MIT licensed). That utility is not a dependency of `@loaders.gl/textures`; applications that use the writer must install it separately.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/textures/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
