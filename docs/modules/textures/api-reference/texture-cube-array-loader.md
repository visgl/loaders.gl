# TextureCubeArrayLoader

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
