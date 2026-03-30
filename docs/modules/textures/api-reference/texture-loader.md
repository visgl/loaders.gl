# TextureLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

A loader for image-based composite textures described by a JSON manifest.

| Loader         | Characteristic                                              |
| -------------- | ----------------------------------------------------------- |
| File Format    | JSON manifest                                               |
| File Extension | `.json`                                                     |
| File Type      | Text                                                        |
| Data Format    | [`Texture`](/docs/modules/textures/README#texture-category) |
| Supported APIs | `load`, `parse`                                             |

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {TextureLoader} from '@loaders.gl/textures';

const image = await load('texture.image-texture.json', TextureLoader);
```

Member images are parsed with `ImageLoader` by default. If you call `load()` with a loader array, those additional loaders are also available for manifest members:

```typescript
import {load} from '@loaders.gl/core';
import {TextureLoader, CompressedTextureLoader, BasisLoader} from '@loaders.gl/textures';

const texture = await load('texture.image-texture.json', [
  TextureLoader,
  CompressedTextureLoader,
  BasisLoader
]);
```

This allows manifest members to use image formats handled by `ImageLoader` as well as compressed member formats handled by the additional loaders.

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
