# TextureLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

A loader for image-based composite textures described by a JSON manifest.

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
