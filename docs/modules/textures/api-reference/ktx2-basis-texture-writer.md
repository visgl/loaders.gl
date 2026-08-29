---
title: KTX2BasisWriter
description: Encode RGBA pixel data as Basis Universal compressed KTX2 textures for portable GPU delivery.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture API / writer"
  title="Write one compressed texture for many GPU families."
  description="KTX2BasisWriter encodes supported RGBA pixel data with Basis Universal and packages the result as KTX2. The output can be transcoded by a consuming runtime to a device-compatible compressed format."
  tone="cyan"
  meta={['KTX2 output', 'Basis Universal', 'Node.js writer']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Basis format', to: '/docs/modules/textures/formats/basis'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<TexturesDocsTabs active="ktx2basiswriter" />

<DocOrientation
  eyebrow="Portable texture output"
  title="Compress once, transcode near the device."
  description="Basis Universal separates distribution compression from the final GPU block format. Write a KTX2 asset once, then let the runtime choose the supported target where it is loaded."
  tone="cyan"
  items={[
    {label: 'Input', value: 'RGBA8, RGBA16F, or RGBA32F pixel data.'},
    {label: 'Encode', value: 'Compress pixels with Basis Universal.'},
    {label: 'Package', value: 'Store the result in a KTX2 container.'},
    {label: 'Transcode', value: 'Choose a device-compatible GPU format at load time.'}
  ]}
/>

<ReferenceBoundary
  title="KTX2BasisWriter reference"
  description="The detailed reference covers accepted pixel data, encoding options, output structure, Node.js requirements, and runtime transcoding."
  tone="cyan"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

`KTX2BasisWriter` encodes RGBA8, RGBA16F, or RGBA32F pixels into a Basis Universal KTX2 texture.

| Loader         | Characteristic                                                           |
| -------------- | ------------------------------------------------------------------------ |
| File Extension | `.ktx2`                                                                  |
| File Type      | Binary                                                                   |
| Data Format    | https://github.com/KhronosGroup/KTX-Specification/blob/main/ktxspec.adoc |
| File Format    | KTX2                                                                     |
| Encoder Type   | Asynchronous                                                             |
| Worker Thread  | No (but may run on separate native thread in browsers)                   |
| Streaming      | No                                                                       |

## Usage

```typescript
import '@loaders.gl/polyfill'; // only if using under Node
import {load, encode} from '@loaders.gl/core';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {KTX2BasisWriter} from '@loaders.gl/textures';

const shannonPNG = 'shannon.png';

const image = getImageData(await load(shannonPNG, ImageBitmapLoader));
const encodedData = await encode(image, KTX2BasisWriter, {
  'ktx2-basis-writer': {
    format: 'uastc-ldr-4x4',
    quality: 80,
    effort: 5,
    contentType: 'srgb',
    mipmaps: true,
    zstd: true
  }
});
```

## Data Format

https://github.com/KhronosGroup/KTX-Specification/blob/main/ktxspec.adoc

## Options

Options are nested under `ktx2-basis-writer`.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `BasisEncoderFormat` | `'etc1s'` | ETC1S, UASTC LDR/HDR, XUASTC, ASTC LDR/HDR, or XUBC7 source codec. |
| `quality` | number 0–100 | codec default | Unified quality/bitrate control. ETC1S defaults to the upstream midpoint. |
| `effort` | number 0–10 | codec default | Unified encoding-effort control. |
| `contentType` | `'linear' \| 'srgb' \| 'normal-map'` | `'linear'` | Applies the corresponding Basis encoder preset. |
| `mipmaps` | boolean | `false` | Generate a complete mip chain. |
| `zstd` | boolean | `false` | Apply Zstandard to UASTC LDR 4×4, UASTC HDR 4×4, or ASTC HDR 6×6. |
| `ldrToHdrNitMultiplier` | number | `100` | Absolute-light scale for RGBA8-to-HDR conversion. |

LDR formats require RGBA8 input. HDR formats accept RGBA8, half-float bit patterns in a
`Uint16Array`, or RGBA float values in a `Float32Array`. An sRGB HDR input is converted to linear
absolute-light values before encoding.

## WASM module

The writer loads the Binomial LLC Basis Universal encoder independently from the decoder:

- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.wasm
- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.js

## Module Overrides

Use `options.modules` to override the Basis encoder runtime used by `KTX2BasisWriter`.

- `modules.basisEncoder`: supply a preloaded Basis encoder module containing `BasisEncoder`.
- `'basis_encoder.js'`: override the URL used for the Basis encoder JavaScript wrapper.
- `'basis_encoder.wasm'`: override the URL used for the Basis encoder WebAssembly binary.
