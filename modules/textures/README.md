# @loaders.gl/textures

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for compressed textures, Radiance HDR textures, and [basis universal textures](https://github.com/BinomialLLC/basis_universal).

## Texture Levels

`BasisLoader` returns `TextureLevel[][]` and preserves every image stored in a `.basis` or `.ktx2` file.

`CompressedTextureLoader` returns `TextureLevel[]` for KTX, DDS and PVR container formats.

`CrunchLoader` returns `TextureLevel[]` for Crunch mip chains.

`RadianceHDRLoader` returns a `Texture` with `shape: 'texture'`, `type: '2d'`, and one decoded `rgba32float` level for Radiance `.hdr` images.

Each returned `TextureLevel` now exposes:

- `shape`: always `'texture-level'`. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `format`: the corresponding WebGL internal format number. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat`: the corresponding luma.gl / WebGPU-style texture format string. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `data`: a typed array containing the mip level payload. Compressed textures expose byte data, while `RadianceHDRLoader` exposes `Float32Array`.

```ts
import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/textures';

const images = await load('texture.ktx2', BasisLoader);

console.log(images[0][0].shape);
console.log(images[0][0].format);
console.log(images[0][0].textureFormat);
```

Use `format` when you need the WebGL enum for legacy APIs. Use `textureFormat` when creating textures through WebGPU-style or luma.gl APIs.

When `basis.format` is set to `'auto'`, you can override the default capability detection by passing a list of supported texture formats:

```ts
import {load} from '@loaders.gl/core';
import {BasisLoader} from '@loaders.gl/textures';

const images = await load('texture.basis', BasisLoader, {
  basis: {
    format: 'auto',
    supportedTextureFormats: ['bc3-rgba-unorm']
  }
});

console.log(images[0][0].format);
console.log(images[0][0].textureFormat);
```

## Composite Image Texture Loaders

The `textures` module also exports JSON manifest loaders for image-based composite textures:

- `TextureLoader` for a single image or mip chain
- `TextureArrayLoader` for texture arrays
- `TextureCubeLoader` for cubemaps
- `TextureCubeArrayLoader` for cube arrays

Each manifest includes a `shape` discriminator and resolves relative member URLs against the manifest URL.
Member assets are parsed with `ImageLoader` by default, and additional loaders passed to top-level `load()` are also available for manifest members.
These loaders return schema `Texture` objects rather than raw image trees.

```ts
import {load} from '@loaders.gl/core';
import {BasisLoader, CompressedTextureLoader, TextureCubeLoader} from '@loaders.gl/textures';

const imageCube = await load('environment.image-texture-cube.json', [
  TextureCubeLoader,
  CompressedTextureLoader,
  BasisLoader
]);
```

### Manifest Shapes

Single image:

```json
{
  "shape": "image-texture",
  "image": "texture.png"
}
```

Single image with mipmaps:

```json
{
  "shape": "image-texture",
  "mipmaps": ["texture-0.png", "texture-1.png", "texture-2.png"]
}
```

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

Cube array:

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

Template-driven mipmaps:

```json
{
  "shape": "image-texture",
  "mipLevels": "auto",
  "template": "texture-{lod}.png"
}
```

Template placeholders are validated strictly. Supported placeholders are:

- `{lod}` for mip level
- `{index}` for array or cube-array layer index
- `{face}`, `{direction}`, `{axis}`, `{sign}` for cubemap faces

Use `\\{` and `\\}` to include literal braces in filenames.

Cube manifests use luma.gl-style face names: `'+X'`, `'-X'`, `'+Y'`, `'-Y'`, `'+Z'`, `'-Z'`. Directional aliases such as `right`, `left`, `top`, `bottom`, `front`, and `back` are still accepted for compatibility, but new manifests should use the luma.gl names.

If you parse an in-memory manifest instead of loading from a URL, provide `options.core.baseUrl` so relative member URLs can still be resolved.

For documentation please visit the [website](https://loaders.gl).
