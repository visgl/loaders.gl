Texture loader

BASIS

# Let the device choose the final texture format.

BasisLoader decodes raw Basis or KTX2-wrapped Basis payloads and transcodes them into a supported compressed or fallback texture format. Applications can keep one portable source asset across GPU families.

[Basis format](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

BASIS[Basis](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[BasisLoader](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)[KTX2BasisWriter](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md)

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

The runtime decision

## Portable input, device-aware output.

Use automatic selection when the runtime can report its texture capabilities, or provide an explicit target when decoding in a worker or coordinating a known rendering path.

01

Inputs

.basis and .ktx2 Basis payloads

02

Selection

Automatic or explicit target texture format

03

Output

One or more images with complete mip levels

04

Options

Supported formats, features, container, and worker settings

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

A loader for Basis Universal "supercompressed" GPU textures. Extracts supercompressed textures from the basis or ktx2 container and efficiently "transpiles" them into the specified compressed texture format.

Detailed guide

## BasisLoader details

The sections below document the normalized output, device selection options, containers, and usage patterns.

| BasisLoader    |                                                                   |
| -------------- | ----------------------------------------------------------------- |
| File Format    | [Basis Universal](https://github.com/BinomialLLC/basis_universal) |
| File Extension | `.basis`, `.ktx2`                                                 |
| File Type      | Binary                                                            |
| Data Format    | `TextureLevel[][]`                                                |
| Supported APIs | `load`, `parse`                                                   |

## Usage[​](#usage "Direct link to Usage")

```
import {BasisLoader} from '@loaders.gl/textures';

import {load} from '@loaders.gl/core';



const miplevels = await load(url, BasisLoader, options);

for (const imageLevels of miplevels) {

  for (const level of imageLevels) {

    console.log(level.format, level.textureFormat);

  }

}
```

## Options[​](#options "Direct link to Options")

| Option                           | Type                                        | Default     | Description                                                                                        |
| -------------------------------- | ------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `basis.format`                   | `'auto' \| BasisFormat \| {alpha, noAlpha}` | `'auto'`    | Select a target explicitly or use source-aware target selection.                                   |
| `basis.supportedTextureFormats`  | `TextureFormat[]`                           | auto-detect | Device formats considered by automatic selection. Pass these explicitly when decoding in a worker. |
| `basis.supportedTextureFeatures` | `{astcHDR?: boolean}`                       | `{}`        | Capabilities not represented by a format list. ASTC HDR is selected only when explicitly enabled.  |
| `basis.containerFormat`          | `'auto' \| 'ktx2' \| 'basis'`               | `'auto'`    | Interpret the input as KTX2, raw Basis, or detect it from the identifier.                          |

## Output[​](#output "Direct link to Output")

Each decoded mip level is returned as a `TextureLevel` with:

* `shape`: `'texture-level'`
* `format`: the WebGL internal format enum
* `textureFormat`: the WebGPU texture format string corresponding to the format of the data in this texture level

When `basis.format` is `'auto'`, selection occurs after the transcoder identifies the source codec, alpha, HDR, sRGB, and block-size properties. Pass `basis.supportedTextureFormats` when decoding in a worker, where a WebGL context is unavailable. KTX2 layers and cubemap faces are returned as separate mip chains in layer-major, face-major order.

## Wasm modules[​](#wasm-modules "Direct link to Wasm modules")

Binomial LLC supplies two WASM modules:

* `basis_transcoder.wasm`, used for all `.basis` and KTX2 decoding;
* `basis_encoder.wasm`, loaded only by `KTX2BasisWriter`.

The pinned upstream commit, hashes, license, and notice are recorded in `modules/textures/src/libs`.

The libraries are loaded during runtime from URLs:

* [https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis\_transcoder.wasm](https://unpkg.com/@loaders.gl/textures@%7BVERSION%7D/dist/libs/basis_transcoder.wasm)
* [https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis\_transcoder.js](https://unpkg.com/@loaders.gl/textures@%7BVERSION%7D/dist/libs/basis_transcoder.js)

## Compressed Texture Formats[​](#compressed-texture-formats "Direct link to Compressed Texture Formats")

The `BasisLoader` can transpile into the following compressed (and uncompressed) texture formats.

| Format                         | Description                                              |
| ------------------------------ | -------------------------------------------------------- |
| `etc1`                         |                                                          |
| `etc2`                         |                                                          |
| `bc1`                          |                                                          |
| `bc3`                          |                                                          |
| `bc4`                          |                                                          |
| `bc5`                          |                                                          |
| `bc7`                          | BC7 RGBA                                                 |
| `pvrtc1-4-rgb`                 |                                                          |
| `pvrtc1-4-rgba`                |                                                          |
| `astc-4x4`                     |                                                          |
| `astc-{block-size}`            | All standard ASTC LDR block sizes from 4×4 through 12×12 |
| `eac-r11`, `eac-rg11`          | One- and two-channel EAC                                 |
| `bc6h`                         | BC6H unsigned HDR                                        |
| `astc-hdr-4x4`, `astc-hdr-6x6` | ASTC HDR targets                                         |
| `rgba16f`, `rgb9e5`            | Portable uncompressed HDR fallbacks                      |
| `atc-rgb`                      |                                                          |
| `atc-rgba-interpolated-alpha`  |                                                          |
| `rgba32`                       |                                                          |
| `rgb565`                       |                                                          |
| `bgr565`                       |                                                          |
| `rgba4444`                     |                                                          |

## Module Overrides[​](#module-overrides "Direct link to Module Overrides")

Use `options.modules` to override the Basis runtime used by `BasisLoader`.

* `modules.basis`: supply a preloaded Basis transcoder module containing `BasisFile` and `KTX2File`.
* `'basis_transcoder.js'`: override the URL used for the Basis transcoder JavaScript wrapper.
* `'basis_transcoder.wasm'`: override the URL used for the Basis transcoder WebAssembly binary.
