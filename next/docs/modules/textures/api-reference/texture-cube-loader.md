Textures API · cubemaps

GPU

# Describe six texture faces once.

TextureCubeLoader reads a JSON manifest for the six faces of a cubemap and can expand face templates into mip levels. The result is ready for the texture upload path used by WebGL and WebGPU applications.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[TextureCubeArrayLoader](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-array-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/texture-cube-array-loader.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

The cubemap path

## Make face orientation and resolution explicit.

A cubemap is six coordinated images, not a regular image array. The manifest keeps the direction names stable and lets each face carry the same mip-level policy.

01

Input

JSON manifest with six directional faces

02

Directions

+X, -X, +Y, -Y, +Z, and -Z

03

Mip levels

Single paths, arrays, or URL templates

04

Decode

ImageBitmapLoader by default

Detailed guide

## Cubemap manifest and options

The reference below documents face naming, mipmaps, templates, image decoding, and loader options.

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

A loader for cubemaps described by a JSON manifest.

| TextureCubeLoader |                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------- |
| File Format       | JSON manifest                                                                       |
| File Extension    | `.json`                                                                             |
| File Type         | Text                                                                                |
| Data Format       | [`Texture`](https://loaders.gl/next/docs/modules/textures.md#texture-category) |
| Supported APIs    | `load`, `parse`                                                                     |

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {TextureCubeLoader} from '@loaders.gl/textures';



const imageCube = await load('environment.image-texture-cube.json', TextureCubeLoader);
```

Member faces are parsed with `ImageBitmapLoader` by default, returning native `ImageBitmap` in browsers and the installed Node.js `ImageBitmap` polyfill when `@loaders.gl/core/polyfills` is present.

## Manifest[​](#manifest "Direct link to Manifest")

Cubemap:

```
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

```
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

* a single image path
* an array of image paths representing mip levels
* a template source object

Template source example:

```
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

Supported template placeholders are `{lod}`, `{face}`, `{direction}`, `{axis}`, and `{sign}`. Use `\\{` and `\\}` to include literal braces in filenames.

## Options[​](#options "Direct link to Options")

| Option         | Type     | Default | Description                                                                        |
| -------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output[​](#output "Direct link to Output")

Returns a `Texture` with:

* `shape: 'texture'`
* `type: 'cube'`
* `data`: one mip chain per cube face, in luma.gl face order
