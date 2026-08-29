---
title: TextureCubeArrayLoader
description: Load layered cubemaps and mip levels from a JSON texture manifest.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Textures API · cube arrays"
  title="Load many cubemaps from one manifest."
  description="TextureCubeArrayLoader reads a JSON manifest whose layers contain six cube faces. It keeps the face layout and optional mip chains explicit for environment, irradiance, and other layered texture data."
  tone="pink"
  meta={['From v5.0', 'JSON manifest', 'Cube faces and mip levels']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'TextureCubeLoader', to: '/docs/modules/textures/api-reference/texture-cube-loader'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'}
  ]}
/>

<DocOrientation
  eyebrow="The cube-array path"
  title="Keep layers, faces, and mip levels addressable."
  description="The manifest is the small piece of structure that a cube-array upload needs. Each layer names its six faces, and each face can point to one image, a mip chain, or a URL template."
  tone="pink"
  items={[
    {label: 'Input', value: 'JSON manifest with one or more cubemap layers'},
    {label: 'Face layout', value: '+X, -X, +Y, -Y, +Z, and -Z'},
    {label: 'Mip levels', value: 'Single paths, arrays, or inferred templates'},
    {label: 'Decode', value: 'ImageBitmapLoader by default, with Node polyfill support'}
  ]}
/>

<ReferenceBoundary
  title="Cube-array manifest and options"
  description="The reference below documents manifest structure, face templates, mip-level discovery, and loader options."
  tone="pink"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

A loader for texture cube arrays described by a JSON manifest.

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
import {TextureCubeArrayLoader} from '@loaders.gl/textures';

const imageCubeArray = await load(
  'environment.image-texture-cube-array.json',
  TextureCubeArrayLoader
);
```

Member faces are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is present.

## Manifest

```json
{
  "shape": "image-texture-cube-array",
  "layers": [
    {
      "faces": {
        "+X": "sky-right.png",
        "-X": "sky-left.png",
        "+Y": "sky-top.png",
        "-Y": "sky-bottom.png",
        "+Z": "sky-front.png",
        "-Z": "sky-back.png"
      }
    },
    {
      "faces": {
        "+X": "irr-right.png",
        "-X": "irr-left.png",
        "+Y": "irr-top.png",
        "-Y": "irr-bottom.png",
        "+Z": "irr-front.png",
        "-Z": "irr-back.png"
      }
    }
  ]
}
```

Each layer is a cubemap manifest fragment. Each face entry can be either:

- a single image path
- an array of image paths representing mip levels
- a template source object

Template source example:

```json
{
  "shape": "image-texture-cube-array",
  "layers": [
    {
      "faces": {
        "+X": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"},
        "-X": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"},
        "+Y": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"},
        "-Y": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"},
        "+Z": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"},
        "-Z": {"mipLevels": "auto", "template": "cube-{index}-{face}-{lod}.png"}
      }
    }
  ]
}
```

Supported template placeholders are `{lod}`, `{index}`, `{face}`, `{direction}`, `{axis}`, and `{sign}`.
Use `\\{` and `\\}` to include literal braces in filenames.

## Options

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output

Returns a `Texture` with:

- `shape: 'texture'`
- `type: 'cube-array'`
- `data`: one cubemap per layer, with one mip chain per face
