# TextureArrayLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
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

Member images are parsed with `ImageLoader` by default. If you pass a loader array to `load()`, those additional loaders are also available for array layers and mip levels.

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
