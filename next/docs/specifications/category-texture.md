Loader category

# Get texture payloads ready for the GPU.

Texture loaders preserve the details that ordinary image loaders do not: mip levels, array and cube layouts, compression formats, and the metadata a runtime needs to choose a supported GPU representation.

[Texture module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

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

Container, payload, runtime

## Keep the texture pipeline explicit.

A KTX2 or Basis asset is a delivery container, not necessarily the final GPU format. loaders.gl exposes the levels and metadata, then can transcode to a device-compatible representation.

01

Containers

KTX, KTX2, DDS, PVR, and Basis

02

Layouts

Mip chains, arrays, cube maps, and 3D textures

03

Transcoding

Basis Universal to a supported runtime format

04

Output

TextureLevel data or normalized texture objects

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

The texture loader category documents the common return shapes, conventions, and helper APIs used for compressed and GPU-oriented texture assets under loaders.gl conventions.

Detailed guide

## Texture data and format details

The sections below cover category loaders, normalized return shapes, container formats, and writer behavior.

## Texture Category Loaders[​](#texture-category-loaders "Direct link to Texture Category Loaders")

| Loader                                                                                                                     | Notes                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md) | Parses KTX, DDS, and PVR texture containers                       |
| [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)                          | Transcodes Basis assets into runtime texture formats              |
| [`RadianceHDRLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/radiance-hdr-loader.md)             | Decodes Radiance `.hdr` textures into floating-point texture data |
| [`CrunchLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)                        | Decodes Crunch compressed mip chains                              |
| [`TextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-loader.md)                      | Loads manifest-driven single image textures and mip chains        |
| [`TextureArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-array-loader.md)           | Loads manifest-driven texture arrays                              |
| [`TextureCubeLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)             | Loads manifest-driven cubemaps                                    |
| [`TextureCubeArrayLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-array-loader.md)  | Loads manifest-driven texture cube arrays                         |

Core texture category support is provided by the `@loaders.gl/textures` module.

## Texture Types[​](#texture-types "Direct link to Texture Types")

Texture loaders in this category return normalized texture payloads from `@loaders.gl/core/schema`.

| Type               | Shape                                 | Description                                                                      |
| ------------------ | ------------------------------------- | -------------------------------------------------------------------------------- |
| `TextureLevel[]`   | Array of mip levels                   | Used by `CompressedTextureLoader` and `CrunchLoader` for a single texture image. |
| `TextureLevel[][]` | Array of images, each with mip levels | Used by `BasisLoader` when an asset contains multiple logical images.            |
| `Texture`          | Object with `shape: 'texture'`        | Used by `RadianceHDRLoader` and manifest-driven texture loaders.                 |

A `TextureLevel` describes one mip level of one texture image.

| Field           | Type              | Description                                                                                                                 |
| --------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `compressed`    | `boolean`         | Whether the mip level data is GPU-compressed.                                                                               |
| `shape`         | `'texture-level'` | Shape tag for normalized texture-level payloads.                                                                            |
| `format`        | `number`          | WebGL internal format enum for the level.                                                                                   |
| `textureFormat` | `TextureFormat`   | WebGPU / luma.gl style format string for the data.                                                                          |
| `data`          | `TypedArray`      | The payload for this mip level. Compressed texture loaders return `Uint8Array`; `RadianceHDRLoader` returns `Float32Array`. |
| `width`         | `number`          | Width of this mip level.                                                                                                    |
| `height`        | `number`          | Height of this mip level.                                                                                                   |
| `levelSize`     | `number`          | Size in bytes for this mip level, when available.                                                                           |
| `hasAlpha`      | `boolean`         | Whether the transcoded or decoded texture contains alpha.                                                                   |

## Compressed Texture Data[​](#compressed-texture-data "Direct link to Compressed Texture Data")

Compressed texture payloads are not directly indexable pixel arrays. Their `data` field contains bytes in the texture container or GPU block-compressed format represented by the `format` / `textureFormat` metadata.

Applications that need ordinary raster pixel access should use the [Image Loaders](https://loaders.gl/next/docs/specifications/category-image.md) category instead.

## Composite Texture Members[​](#composite-texture-members "Direct link to Composite Texture Members")

Manifest-driven texture loaders resolve member images through [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md). Member assets return native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is present.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {BasisLoader} from '@loaders.gl/textures';



const images = await load('texture.ktx2', BasisLoader, {

  basis: {

    format: 'auto',

    supportedTextureFormats: ['bc3-rgba-unorm']

  }

});
```

## Notes[​](#notes "Direct link to Notes")

### About image loaders[​](#about-image-loaders "Direct link to About image loaders")

Standard raster image loading, `getImageData(image)`, and the Node.js `ImageBitmap` polyfill used by `ImageBitmapLoader` are documented separately in [Image Loaders](https://loaders.gl/next/docs/specifications/category-image.md).
