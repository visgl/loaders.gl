---
title: BasisLoader
description: Transcode Basis Universal payloads into texture levels suited to the current device.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture loader"
  title="Let the device choose the final texture format."
  description="BasisLoader decodes raw Basis or KTX2-wrapped Basis payloads and transcodes them into a supported compressed or fallback texture format. Applications can keep one portable source asset across GPU families."
  tone="cyan"
  meta={['Basis / KTX2', 'Runtime transcoding', 'TextureLevel[][]']}
  links={[
    {label: 'Basis format', to: '/docs/modules/textures/formats/basis'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<TexturesDocsTabs active="basisloader" />

<DocOrientation
  eyebrow="The runtime decision"
  title="Portable input, device-aware output."
  description="Use automatic selection when the runtime can report its texture capabilities, or provide an explicit target when decoding in a worker or coordinating a known rendering path."
  tone="cyan"
  items={[
    {label: 'Inputs', value: '.basis and .ktx2 Basis payloads'},
    {label: 'Selection', value: 'Automatic or explicit target texture format'},
    {label: 'Output', value: 'One or more images with complete mip levels'},
    {label: 'Options', value: 'Supported formats, features, container, and worker settings'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

A loader for Basis Universal "supercompressed" GPU textures. Extracts supercompressed textures from the basis or ktx2 container and efficiently "transpiles" them into the specified compressed texture format.

<ReferenceBoundary
  title="BasisLoader details"
  description="The sections below document the normalized output, device selection options, containers, and usage patterns."
  tone="cyan"
/>

| Loader         | Characteristic                                                    |
| -------------- | ----------------------------------------------------------------- |
| File Format    | [Basis Universal](https://github.com/BinomialLLC/basis_universal) |
| File Extension | `.basis`, `.ktx2`                                                 |
| File Type      | Binary                                                            |
| Data Format    | `TextureLevel[][]`                                                |
| Supported APIs | `load`, `parse`                                                   |

## Usage

```typescript
import {BasisLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const miplevels = await load(url, BasisLoader, options);
for (const imageLevels of miplevels) {
  for (const level of imageLevels) {
    console.log(level.format, level.textureFormat);
  }
}
```

## Options

| Option                           | Type                                           | Default     | Description                                                                                                  |
| -------------------------------- | ---------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `basis.format`                   | `'auto' \| BasisFormat \| {alpha, noAlpha}`      | `'auto'`    | Select a target explicitly or use source-aware target selection.                                             |
| `basis.supportedTextureFormats`  | `TextureFormat[]`                              | auto-detect | Device formats considered by automatic selection. Pass these explicitly when decoding in a worker.          |
| `basis.supportedTextureFeatures` | `{astcHDR?: boolean}`                          | `{}`        | Capabilities not represented by a format list. ASTC HDR is selected only when explicitly enabled.           |
| `basis.containerFormat`          | `'auto' \| 'ktx2' \| 'basis'`                  | `'auto'`    | Interpret the input as KTX2, raw Basis, or detect it from the identifier.                                    |

## Output

Each decoded mip level is returned as a `TextureLevel` with:

- `shape`: `'texture-level'`
- `format`: the WebGL internal format enum
- `textureFormat`: the WebGPU texture format string corresponding to the format of the data in this texture level

When `basis.format` is `'auto'`, selection occurs after the transcoder identifies the source codec,
alpha, HDR, sRGB, and block-size properties. Pass `basis.supportedTextureFormats` when decoding in a
worker, where a WebGL context is unavailable. KTX2 layers and cubemap faces are returned as separate
mip chains in layer-major, face-major order.

## Wasm modules

Binomial LLC supplies two WASM modules:

- `basis_transcoder.wasm`, used for all `.basis` and KTX2 decoding;
- `basis_encoder.wasm`, loaded only by `KTX2BasisWriter`.

The pinned upstream commit, hashes, license, and notice are recorded in `modules/textures/src/libs`.

The libraries are loaded during runtime from URLs:

- https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.wasm
- https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.js

## Compressed Texture Formats

The `BasisLoader` can transpile into the following compressed (and uncompressed) texture formats.

| Format                        | Description |
| ----------------------------- | ----------- |
| `etc1`                        |             |
| `etc2`                        |             |
| `bc1`                         |             |
| `bc3`                         |             |
| `bc4`                         |             |
| `bc5`                         |             |
| `bc7`                         | BC7 RGBA    |
| `pvrtc1-4-rgb`                |             |
| `pvrtc1-4-rgba`               |             |
| `astc-4x4`                    |             |
| `astc-{block-size}`           | All standard ASTC LDR block sizes from 4×4 through 12×12 |
| `eac-r11`, `eac-rg11`        | One- and two-channel EAC |
| `bc6h`                        | BC6H unsigned HDR |
| `astc-hdr-4x4`, `astc-hdr-6x6` | ASTC HDR targets |
| `rgba16f`, `rgb9e5`          | Portable uncompressed HDR fallbacks |
| `atc-rgb`                     |             |
| `atc-rgba-interpolated-alpha` |             |
| `rgba32`                      |             |
| `rgb565`                      |             |
| `bgr565`                      |             |
| `rgba4444`                    |             |

## Module Overrides

Use `options.modules` to override the Basis runtime used by `BasisLoader`.

- `modules.basis`: supply a preloaded Basis transcoder module containing `BasisFile` and `KTX2File`.
- `'basis_transcoder.js'`: override the URL used for the Basis transcoder JavaScript wrapper.
- `'basis_transcoder.wasm'`: override the URL used for the Basis transcoder WebAssembly binary.
