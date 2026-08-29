---
title: TextureArrayLoader
description: Load a JSON texture-array manifest and assemble its member images into a shared array texture representation.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Texture API / manifest loader"
  title="Describe an array of images, then load it as one texture."
  description="TextureArrayLoader reads a JSON manifest that names the member images and their layout. It delegates image decoding to ImageBitmapLoader and returns a texture-array shape with the array structure still visible."
  tone="mint"
  meta={['JSON manifest', 'Image arrays', 'Delegated image loading']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'}
  ]}
/>

<DocOrientation
  eyebrow="Manifest-driven texture data"
  title="Keep layout metadata beside the image references."
  description="An array texture is more than a list of URLs: the manifest describes its shape and member ordering. The loader keeps those details explicit while reusing the standard image decoding path."
  tone="mint"
  items={[
    {label: 'Manifest', value: 'Declare an image-texture-array shape and member resources.'},
    {label: 'Resolve', value: 'Load member images through the configured image loader.'},
    {label: 'Assemble', value: 'Preserve ordering, dimensions, and array metadata.'},
    {label: 'Upload', value: 'Hand the normalized texture array to the graphics runtime.'}
  ]}
/>

<ReferenceBoundary
  title="TextureArrayLoader reference"
  description="The detailed reference covers manifest structure, member-image loading, options, dimensions, and output texture-array fields."
  tone="mint"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

A loader for texture arrays described by a JSON manifest.

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
import {TextureArrayLoader} from '@loaders.gl/textures';

const images = await load('texture-array.image-texture-array.json', TextureArrayLoader);
```

Member images are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is present.

## Manifest

Texture array:

```json
{
  "shape": "image-texture-array",
  "layers": ["layer-0.png", "layer-1.png"]
}
```

Texture array with mipmaps:

```json
{
  "shape": "image-texture-array",
  "layers": [
    ["layer-0-0.png", "layer-0-1.png"],
    ["layer-1-0.png", "layer-1-1.png"]
  ]
}
```

Each entry in `layers` can be either:

- a single image path
- an array of image paths representing mip levels
- a template source object

Template source example:

```json
{
  "shape": "image-texture-array",
  "layers": [
    {"mipLevels": "auto", "template": "layer-{index}-{lod}.png"},
    {"mipLevels": "auto", "template": "layer-{index}-{lod}.png"}
  ]
}
```

Supported template placeholders are `{lod}` and `{index}`.
Use `\\{` and `\\}` to include literal braces in filenames.

## Options

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output

Returns a `Texture` with:

- `shape: 'texture'`
- `type: '2d-array'`
- `data`: one mip chain per array layer
