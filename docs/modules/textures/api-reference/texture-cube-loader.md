---
title: TextureCubeLoader
description: Load a cubemap and its optional mip levels from a JSON manifest.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Textures API · cubemaps"
  title="Describe six texture faces once."
  description="TextureCubeLoader reads a JSON manifest for the six faces of a cubemap and can expand face templates into mip levels. The result is ready for the texture upload path used by WebGL and WebGPU applications."
  tone="pink"
  meta={['From v5.0', 'JSON manifest', 'Mip-aware cubemap']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'TextureCubeArrayLoader', to: '/docs/modules/textures/api-reference/texture-cube-array-loader'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<DocOrientation
  eyebrow="The cubemap path"
  title="Make face orientation and resolution explicit."
  description="A cubemap is six coordinated images, not a regular image array. The manifest keeps the direction names stable and lets each face carry the same mip-level policy."
  tone="pink"
  items={[
    {label: 'Input', value: 'JSON manifest with six directional faces'},
    {label: 'Directions', value: '+X, -X, +Y, -Y, +Z, and -Z'},
    {label: 'Mip levels', value: 'Single paths, arrays, or URL templates'},
    {label: 'Decode', value: 'ImageBitmapLoader by default'}
  ]}
/>

<ReferenceBoundary
  title="Cubemap manifest and options"
  description="The reference below documents face naming, mipmaps, templates, image decoding, and loader options."
  tone="pink"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

A loader for cubemaps described by a JSON manifest.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Format    | JSON manifest                                        |
| File Extension | `.json`                                              |
| File Type      | Text                                                 |
| Data Format    | [`Texture`](/docs/modules/textures#texture-category) |
| Supported APIs | `load`, `parse`                                      |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {TextureCubeLoader} from '@loaders.gl/textures';

const imageCube = await load('environment.image-texture-cube.json', TextureCubeLoader);
```

Member faces are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is present.

## Manifest

Cubemap:

```json
{
  "shape": "image-texture-cube",
  "faces": {
    "+X": "right.png",
    "-X": "left.png",
    "+Y": "top.png",
    "-Y": "bottom.png",
    "+Z": "front.png",
    "-Z": "back.png"
  }
}
```

Cubemap with mipmaps:

```json
{
  "shape": "image-texture-cube",
  "faces": {
    "+X": ["right-0.png", "right-1.png"],
    "-X": ["left-0.png", "left-1.png"],
    "+Y": ["top-0.png", "top-1.png"],
    "-Y": ["bottom-0.png", "bottom-1.png"],
    "+Z": ["front-0.png", "front-1.png"],
    "-Z": ["back-0.png", "back-1.png"]
  }
}
```

Face names follow luma.gl conventions: `'+X'`, `'-X'`, `'+Y'`, `'-Y'`, `'+Z'`, `'-Z'`.

Each face entry can be either:

- a single image path
- an array of image paths representing mip levels
- a template source object

Template source example:

```json
{
  "shape": "image-texture-cube",
  "faces": {
    "+X": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"},
    "-X": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"},
    "+Y": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"},
    "-Y": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"},
    "+Z": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"},
    "-Z": {"mipLevels": "auto", "template": "cube-{face}-{lod}.png"}
  }
}
```

Supported template placeholders are `{lod}`, `{face}`, `{direction}`, `{axis}`, and `{sign}`.
Use `\\{` and `\\}` to include literal braces in filenames.

## Options

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output

Returns a `Texture` with:

- `shape: 'texture'`
- `type: 'cube'`
- `data`: one mip chain per cube face, in luma.gl face order
