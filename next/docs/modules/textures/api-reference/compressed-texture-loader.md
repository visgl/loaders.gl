Texture container loader

GPU

# Preserve the mip chain and the GPU format.

CompressedTextureLoader reads KTX, KTX2, DDS, and PVR containers without reducing them to ordinary pixels. The result keeps each level's dimensions, compression state, and runtime format metadata.

[KTX format](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

GPU[Compressed Textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[CompressedTextureWriter](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md)

Container in, levels out

## Keep the data in the form a renderer expects.

The loader returns normalized levels rather than a browser image object. That makes container metadata available to WebGL, WebGPU, and application-specific texture upload code.

01

Reads

KTX, KTX2, DDS, and PVR containers

02

Preserves

Dimensions, mip levels, compression, and format tags

03

Returns

TextureLevel\[] with typed payloads

04

Pairs with

BasisLoader for KTX2 Basis transcoding

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

Loader for compressed texture containers in the KTX, DDS and PVR formats.

Detailed guide

## Compressed texture details

The sections below cover container support, usage, normalized texture levels, and format-specific metadata.

| CompressedTextureLoader |                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format             | [PVR](http://powervr-graphics.github.io/WebGL_SDK/WebGL_SDK/Documentation/Specifications/PVR%20File%20Format.Specification.pdf), [DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide), [KTX](https://github.com/KhronosGroup/KTX-Software/) |
| File Extension          | `.dds`, `.pvr`, `.ktx`, `.ktx2`                                                                                                                                                                                                                                                 |
| File Type               | Binary                                                                                                                                                                                                                                                                          |
| Data Format             | `TextureLevel[]`                                                                                                                                                                                                                                                                |
| Supported APIs          | `load`, `parse`                                                                                                                                                                                                                                                                 |

## Usage[​](#usage "Direct link to Usage")

```
import {CompressedTextureLoader} from '@loaders.gl/textures';

import {load} from '@loaders.gl/core';



const mipLevels = await load(url, CompressedTextureLoader);

for (const level of mipLevels) {

  console.log(level.shape, level.format, level.textureFormat);

}
```

## Data Format[​](#data-format "Direct link to Data Format")

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

* `shape: 'texture-level'` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `compressed`
* `format` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `textureFormat` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `width`
* `height`
* `data`
* `levelSize` when available

## Options[​](#options "Direct link to Options")

| Option                        | Type    | Default | Description                                                                                                                |
| ----------------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `compressed-texture.useBasis` | Boolean | `false` | Use [BasisLoader](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md) to decode KTX2 texture |

## Basis loader[​](#basis-loader "Direct link to Basis loader")

Use [BasisLoader](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md) for KTX2 assets that need Basis transcoding.

## Module Overrides[​](#module-overrides "Direct link to Module Overrides")

When `compressed-texture.useBasis` is `true`, `CompressedTextureLoader` uses the Basis transcoder runtime through `options.modules`.

* `modules.basis`: supply a preloaded transcoder module containing `KTX2File`.
* `'basis_transcoder.js'`: override the transcoder JavaScript wrapper URL.
* `'basis_transcoder.wasm'`: override the transcoder WebAssembly URL.
