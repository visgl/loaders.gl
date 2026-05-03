# Texture Loaders

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

The texture loader category documents the common return shapes, conventions, and helper APIs used for compressed and GPU-oriented texture assets under loaders.gl conventions.

## Texture Category Loaders

| Loader                                                                                      | Notes                                                            |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader) | Parses KTX, DDS, and PVR texture containers                      |
| [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)                          | Transcodes Basis assets into runtime texture formats             |
| [`RadianceHDRLoader`](/docs/modules/textures/api-reference/radiance-hdr-loader)             | Decodes Radiance `.hdr` textures into floating-point texture data |
| [`CrunchLoader`](/docs/modules/textures/api-reference/crunch-loader)                        | Decodes Crunch compressed mip chains                             |
| [`TextureLoader`](/docs/modules/textures/api-reference/texture-loader)                      | Loads manifest-driven single image textures and mip chains       |
| [`TextureArrayLoader`](/docs/modules/textures/api-reference/texture-array-loader)           | Loads manifest-driven texture arrays                             |
| [`TextureCubeLoader`](/docs/modules/textures/api-reference/texture-cube-loader)             | Loads manifest-driven cubemaps                                   |
| [`TextureCubeArrayLoader`](/docs/modules/textures/api-reference/texture-cube-array-loader)  | Loads manifest-driven texture cube arrays                        |

Core texture category support is provided by the `@loaders.gl/textures` module.

## Texture Types

Texture loaders in this category return normalized texture payloads from `@loaders.gl/schema`.

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

## Compressed Texture Data

Compressed texture payloads are not directly indexable pixel arrays. Their `data` field contains bytes in the texture container or GPU block-compressed format represented by the `format` / `textureFormat` metadata.

Applications that need ordinary raster pixel access should use the [Image Loaders](/docs/specifications/category-image) category instead.

## Composite Texture Members

Manifest-driven texture loaders resolve member images through [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader). Member assets return native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is present.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/textures';

const images = await load('texture.ktx2', BasisLoader, {
  basis: {
    format: 'auto',
    supportedTextureFormats: ['bc3-rgba-unorm']
  }
});
```

## Notes

### About image loaders

Standard raster image loading, `getImageData(image)`, and the Node.js `ImageBitmap` polyfill used by `ImageBitmapLoader` are documented separately in [Image Loaders](/docs/specifications/category-image).
