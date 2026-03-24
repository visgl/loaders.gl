# TextureCubeLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

A loader for cubemaps described by a JSON manifest.

| Loader         | Characteristic               |
| -------------- | ---------------------------- |
| File Format    | JSON manifest                |
| File Extension | `.json`                      |
| File Type      | Text                         |
| Data Format    | [`Texture`](/docs/modules/textures/README#texture-category) |
| Supported APIs | `load`, `parse`              |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {TextureCubeLoader} from '@loaders.gl/textures';

const imageCube = await load('environment.image-texture-cube.json', TextureCubeLoader);
```

Member faces are parsed with `ImageLoader` by default. If you pass a loader array to `load()`, those additional loaders are also available for cubemap faces and mip levels.

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

| Option         | Type     | Default | Description                                                                 |
| -------------- | -------- | ------- | --------------------------------------------------------------------------- |
| `core.baseUrl` | `string` | -       | Base URL used to resolve relative member paths when parsing an in-memory manifest. |

## Output

Returns a `Texture` with:

- `shape: 'texture'`
- `type: 'cube'`
- `data`: one mip chain per cube face, in luma.gl face order
