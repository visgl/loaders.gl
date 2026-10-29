Textures API · cube arrays

GPU

# Load many cubemaps from one manifest.

TextureCubeArrayLoader reads a JSON manifest whose layers contain six cube faces. It keeps the face layout and optional mip chains explicit for environment, irradiance, and other layered texture data.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[TextureCubeLoader](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-loader.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

The cube-array path

## Keep layers, faces, and mip levels addressable.

The manifest is the small piece of structure that a cube-array upload needs. Each layer names its six faces, and each face can point to one image, a mip chain, or a URL template.

01

Input

JSON manifest with one or more cubemap layers

02

Face layout

+X, -X, +Y, -Y, +Z, and -Z

03

Mip levels

Single paths, arrays, or inferred templates

04

Decode

ImageBitmapLoader by default, with Node polyfill support

Detailed guide

## Cube-array manifest and options

The reference below documents manifest structure, face templates, mip-level discovery, and loader options.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

A loader for texture cube arrays described by a JSON manifest.

| TextureCubeArrayLoader |                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| File Format            | JSON manifest                                                                       |
| File Extension         | `.json`                                                                             |
| File Type              | Text                                                                                |
| Data Format            | [`Texture`](https://loaders.gl/next/docs/modules/textures.md#texture-category) |
| Supported APIs         | `load`, `parse`                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {TextureCubeArrayLoader} from '@loaders.gl/textures';



const imageCubeArray = await load(

  'environment.image-texture-cube-array.json',

  TextureCubeArrayLoader

);
```

Member faces are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is present.

## Manifest[​](#manifest "Direct link to Manifest")

```
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

* a single image path
* an array of image paths representing mip levels
* a template source object

Template source example:

```
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

Supported template placeholders are `{lod}`, `{index}`, `{face}`, `{direction}`, `{axis}`, and `{sign}`. Use `\\{` and `\\}` to include literal braces in filenames.

## Options[​](#options "Direct link to Options")

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output[​](#output "Direct link to Output")

Returns a `Texture` with:

* `shape: 'texture'`
* `type: 'cube-array'`
* `data`: one cubemap per layer, with one mip chain per face
