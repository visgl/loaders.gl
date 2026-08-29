---
title: CompressedTextureLoader
description: Parse KTX, DDS, and PVR containers into normalized compressed texture levels.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture container loader"
  title="Preserve the mip chain and the GPU format."
  description="CompressedTextureLoader reads KTX, KTX2, DDS, and PVR containers without reducing them to ordinary pixels. The result keeps each level's dimensions, compression state, and runtime format metadata."
  tone="cyan"
  meta={['KTX / KTX2', 'DDS / PVR', 'TextureLevel[]']}
  links={[
    {label: 'KTX format', to: '/docs/modules/textures/formats/ktx'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<TexturesDocsTabs active="compressedtextureloader" />

<DocOrientation
  eyebrow="Container in, levels out"
  title="Keep the data in the form a renderer expects."
  description="The loader returns normalized levels rather than a browser image object. That makes container metadata available to WebGL, WebGPU, and application-specific texture upload code."
  tone="cyan"
  items={[
    {label: 'Reads', value: 'KTX, KTX2, DDS, and PVR containers'},
    {label: 'Preserves', value: 'Dimensions, mip levels, compression, and format tags'},
    {label: 'Returns', value: 'TextureLevel[] with typed payloads'},
    {label: 'Pairs with', value: 'BasisLoader for KTX2 Basis transcoding'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed texture containers in the KTX, DDS and PVR formats.

<ReferenceBoundary
  title="Compressed texture details"
  description="The sections below cover container support, usage, normalized texture levels, and format-specific metadata."
  tone="cyan"
/>

| Loader         | Characteristic                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format    | [PVR](http://powervr-graphics.github.io/WebGL_SDK/WebGL_SDK/Documentation/Specifications/PVR%20File%20Format.Specification.pdf), [DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide), [KTX](https://github.com/KhronosGroup/KTX-Software/) |
| File Extension | `.dds`, `.pvr`, `.ktx`, `.ktx2`                                                                                                                                                                                                                                                 |
| File Type      | Binary                                                                                                                                                                                                                                                                          |
| Data Format    | `TextureLevel[]`                                                                                                                                                                                                                                                                |
| Supported APIs | `load`, `parse`                                                                                                                                                                                                                                                                 |

## Usage

```typescript
import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CompressedTextureLoader);
for (const level of mipLevels) {
  console.log(level.shape, level.format, level.textureFormat);
}
```

## Data Format

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed`
- `format` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `width`
- `height`
- `data`
- `levelSize` when available

## Options

| Option                        | Type    | Default | Description                                                                                 |
| ----------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------- |
| `compressed-texture.useBasis` | Boolean | `false` | Use [BasisLoader](/docs/modules/textures/api-reference/basis-loader) to decode KTX2 texture |

## Basis loader

Use [BasisLoader](/docs/modules/textures/api-reference/basis-loader) for KTX2 assets that need Basis transcoding.

## Module Overrides

When `compressed-texture.useBasis` is `true`, `CompressedTextureLoader` uses the Basis transcoder runtime through `options.modules`.

- `modules.basis`: supply a preloaded transcoder module containing `KTX2File`.
- `'basis_transcoder.js'`: override the transcoder JavaScript wrapper URL.
- `'basis_transcoder.wasm'`: override the transcoder WebAssembly URL.
