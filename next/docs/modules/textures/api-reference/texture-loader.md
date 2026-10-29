Composite texture loader

GPU

# Describe a texture once. Resolve its image levels as a unit.

`TextureLoader` reads a JSON manifest for a single image or mip chain, resolves member URLs, and returns a normalized `Texture` object. It keeps file organization out of the rendering code.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)[ImageBitmapLoader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

The manifest path

## Read the manifest. Resolve the members. Return one texture.

A composite texture can be a single image, an explicit list of mip levels, or a template-driven sequence. The loader turns each supported description into the same schema-level texture shape.

01

Input

JSON image-texture manifest

02

Resolve

Relative member URLs and optional base URL

03

Decode

Member images through ImageBitmapLoader

04

Output

Texture with ordered TextureLevel entries

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

A loader for image-based composite textures described by a JSON manifest.

Detailed guide

## Manifest and texture output details

The reference below covers manifest forms, URL resolution, member decoding, mip levels, options, and normalized output fields.

| TextureLoader  |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| File Format    | JSON manifest                                                                       |
| File Extension | `.json`                                                                             |
| File Type      | Text                                                                                |
| Data Format    | [`Texture`](https://loaders.gl/next/docs/modules/textures.md#texture-category) |
| Supported APIs | `load`, `parse`                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {TextureLoader} from '@loaders.gl/textures';



const image = await load('texture.image-texture.json', TextureLoader);
```

Member images are parsed with `ImageBitmapLoader` by default:

```
import {load} from '@loaders.gl/core';

import {TextureLoader} from '@loaders.gl/textures';



const texture = await load('texture.image-texture.json', TextureLoader);
```

Member images use the same runtime-dependent bitmap contract as [`ImageBitmapLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md): native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is present.

## Manifest[​](#manifest "Direct link to Manifest")

Single image:

```
{

  "shape": "image-texture",

  "image": "texture.png"

}
```

Mipmapped image:

```
{

  "shape": "image-texture",

  "mipmaps": ["texture-0.png", "texture-1.png", "texture-2.png"]

}
```

Template-driven mipmapped image:

```
{

  "shape": "image-texture",

  "mipLevels": "auto",

  "template": "texture-{lod}.png"

}
```

Template placeholders are validated strictly. Supported placeholders for `TextureLoader` are `{lod}` only. Use `\\{` and `\\}` to include literal braces in filenames.

## Options[​](#options "Direct link to Options")

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output[​](#output "Direct link to Output")

Returns a `Texture` with:

* `shape: 'texture'`
* `type: '2d'`
* `data`: one `TextureLevel` per mip level

For image-backed levels, `TextureLevel.imageBitmap` is populated when available and `TextureLevel.data` is an empty `Uint8Array`.
