---
title: RadianceHDRLoader
description: Decode Radiance RGBE HDR images into texture data for environment lighting and high-dynamic-range workflows.
hide_title: true
page_style: designed
---

import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture API / HDR loader"
  title="Load lighting data without flattening its range."
  description="RadianceHDRLoader reads RGBE `.hdr` files and returns texture levels with floating-point samples and format metadata. Exposure, tone mapping, and environment use remain decisions for the application or renderer."
  tone="orange"
  meta={['Radiance RGBE', 'Floating-point samples', 'Environment textures']}
  links={[
    {label: 'Radiance HDR format', to: '/docs/modules/textures/formats/hdr'},
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Image category', to: '/docs/specifications/category-image'}
  ]}
/>

<TexturesDocsTabs active="radiancehdrloader" />

<DocOrientation
  eyebrow="HDR decode path"
  title="Return texture data; leave display policy to the renderer."
  description="The loader expands RGBE values into a usable texture representation. Applications can then select environment mapping, filtering, exposure, and tone mapping according to the scene."
  tone="orange"
  items={[
    {label: 'Detect', value: 'Read Radiance HDR headers and scanline-encoded data.'},
    {label: 'Expand', value: 'Decode shared-exponent RGBE pixels.'},
    {label: 'Return', value: 'Expose dimensions, levels, formats, and floating-point data.'},
    {label: 'Render', value: 'Apply application-specific lighting and display policy.'}
  ]}
/>

<ReferenceBoundary
  title="RadianceHDRLoader reference"
  description="The detailed reference covers input detection, decoded texture levels, RGBE values, options, and common rendering uses."
  tone="orange"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Loader for Radiance RGBE `.hdr` textures.

See also: [`Radiance HDR`](/docs/modules/textures/formats/hdr)

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Format    | Radiance HDR / RGBE                                  |
| File Extension | `.hdr`                                               |
| File Type      | Binary                                               |
| Data Format    | [`Texture`](/docs/modules/textures#texture-category) |
| Supported APIs | `load`, `parse`, `parseSync`                         |

## Usage

```typescript
import {RadianceHDRLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const texture = await load(url, RadianceHDRLoader);
const level = texture.data[0];

console.log(texture.type, level.width, level.height);
console.log(texture.format, level.format);
console.log(level.data instanceof Float32Array);
console.log(texture.metadata?.exposure);
```

## Data Format

Returns a `Texture` with `shape: 'texture'`, `type: '2d'`, and one decoded level in `data`.

The returned texture includes:

- `shape: 'texture'`
- `type: '2d'`
- `format: 'rgba32float'`
- `data: TextureLevel[]`
- `metadata?: RadianceHDRMetadata`

## Metadata

When present in the file, `RadianceHDRLoader` exposes application-facing header metadata on `texture.metadata`.

```typescript
type RadianceHDRMetadata = {
  colorCorrection?: [number, number, number];
  exposure?: number;
  gamma?: number;
  pixelAspectRatio?: number;
  primaries?: [number, number, number, number, number, number, number, number];
  software?: string;
  view?: string;
};
```

The loader does not expose internal parsing fields such as normalized scanline orientation or format markers in `metadata`.

The returned level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed: false`
- `format: GL_RGBA32F`
- `textureFormat: 'rgba32float'`
- `width`
- `height`
- `data: Float32Array`
- `levelSize`

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |

## Notes

- File format background: [`Radiance HDR`](/docs/modules/textures/formats/hdr)
- `RadianceHDRLoader` decodes standard 2D Radiance RGBE files only.
- The alpha channel is synthesized as `1.0` for every pixel.
