Texture API / manifest loader

GPU

# Describe an array of images, then load it as one texture.

TextureArrayLoader reads a JSON manifest that names the member images and their layout. It delegates image decoding to ImageBitmapLoader and returns a texture-array shape with the array structure still visible.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)[ImageBitmapLoader](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images/api-reference/image-bitmap-loader.md)

Manifest-driven texture data

## Keep layout metadata beside the image references.

An array texture is more than a list of URLs: the manifest describes its shape and member ordering. The loader keeps those details explicit while reusing the standard image decoding path.

01

Manifest

Declare an image-texture-array shape and member resources.

02

Resolve

Load member images through the configured image loader.

03

Assemble

Preserve ordering, dimensions, and array metadata.

04

Upload

Hand the normalized texture array to the graphics runtime.

Detailed guide

## TextureArrayLoader reference

The detailed reference covers manifest structure, member-image loading, options, dimensions, and output texture-array fields.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

A loader for texture arrays described by a JSON manifest.

| TextureArrayLoader |                                                                                     |
| ------------------ | ----------------------------------------------------------------------------------- |
| File Format        | JSON manifest                                                                       |
| File Extension     | `.json`                                                                             |
| File Type          | Text                                                                                |
| Data Format        | [`Texture`](https://loaders.gl/next/docs/modules/textures.md#texture-category) |
| Supported APIs     | `load`, `parse`                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {TextureArrayLoader} from '@loaders.gl/textures';



const images = await load('texture-array.image-texture-array.json', TextureArrayLoader);
```

Member images are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is present.

## Manifest[​](#manifest "Direct link to Manifest")

Texture array:

```
{

  "shape": "image-texture-array",

  "layers": ["layer-0.png", "layer-1.png"]

}
```

Texture array with mipmaps:

```
{

  "shape": "image-texture-array",

  "layers": [

    ["layer-0-0.png", "layer-0-1.png"],

    ["layer-1-0.png", "layer-1-1.png"]

  ]

}
```

Each entry in `layers` can be either:

* a single image path
* an array of image paths representing mip levels
* a template source object

Template source example:

```
{

  "shape": "image-texture-array",

  "layers": [

    {"mipLevels": "auto", "template": "layer-{index}-{lod}.png"},

    {"mipLevels": "auto", "template": "layer-{index}-{lod}.png"}

  ]

}
```

Supported template placeholders are `{lod}` and `{index}`. Use `\\{` and `\\}` to include literal braces in filenames.

## Options[​](#options "Direct link to Options")

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output[​](#output "Direct link to Output")

Returns a `Texture` with:

* `shape: 'texture'`
* `type: '2d-array'`
* `data`: one mip chain per array layer
