---
title: TextureLoader
description: Load a manifest-driven image texture or mip chain into a normalized texture object.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Composite texture loader"
  title="Describe a texture once. Resolve its image levels as a unit."
  description="`TextureLoader` reads a JSON manifest for a single image or mip chain, resolves member URLs, and returns a normalized `Texture` object. It keeps file organization out of the rendering code."
  tone="cyan"
  meta={['JSON manifest', 'Mipmapped images', 'Normalized Texture output']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Texture category', to: '/docs/specifications/category-texture'},
    {label: 'ImageBitmapLoader', to: '/docs/modules/images/api-reference/image-bitmap-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The manifest path"
  title="Read the manifest. Resolve the members. Return one texture."
  description="A composite texture can be a single image, an explicit list of mip levels, or a template-driven sequence. The loader turns each supported description into the same schema-level texture shape."
  tone="cyan"
  items={[
    {label: 'Input', value: 'JSON image-texture manifest'},
    {label: 'Resolve', value: 'Relative member URLs and optional base URL'},
    {label: 'Decode', value: 'Member images through ImageBitmapLoader'},
    {label: 'Output', value: 'Texture with ordered TextureLevel entries'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

A loader for image-based composite textures described by a JSON manifest.

<ReferenceBoundary
  title="Manifest and texture output details"
  description="The reference below covers manifest forms, URL resolution, member decoding, mip levels, options, and normalized output fields."
  tone="cyan"
/>

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
import {TextureLoader} from '@loaders.gl/textures';

const image = await load('texture.image-texture.json', TextureLoader);
```

Member images are parsed with `ImageBitmapLoader` by default:

```typescript
import {load} from '@loaders.gl/core';
import {TextureLoader} from '@loaders.gl/textures';

const texture = await load('texture.image-texture.json', TextureLoader);
```

Member images use the same runtime-dependent bitmap contract as [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader): native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/polyfills` is present.

## Manifest

Single image:

```json
{
  "shape": "image-texture",
  "image": "texture.png"
}
```

Mipmapped image:

```json
{
  "shape": "image-texture",
  "mipmaps": ["texture-0.png", "texture-1.png", "texture-2.png"]
}
```

Template-driven mipmapped image:

```json
{
  "shape": "image-texture",
  "mipLevels": "auto",
  "template": "texture-{lod}.png"
}
```

Template placeholders are validated strictly. Supported placeholders for `TextureLoader` are `{lod}` only.
Use `\\{` and `\\}` to include literal braces in filenames.

## Options

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output

Returns a `Texture` with:

- `shape: 'texture'`
- `type: '2d'`
- `data`: one `TextureLevel` per mip level

For image-backed levels, `TextureLevel.imageBitmap` is populated when available and `TextureLevel.data` is an empty `Uint8Array`.
