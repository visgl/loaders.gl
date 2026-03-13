# @loaders.gl/textures

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for compressed textures and [basis universal textures](https://github.com/BinomialLLC/basis_universal).

## Texture Levels

`BasisLoader` returns `TextureLevel[][]` and preserves every image stored in a `.basis` or `.ktx2` file.

`CompressedTextureLoader` returns `TextureLevel[]` for KTX, DDS and PVR container formats.

`CrunchLoader` returns `TextureLevel[]` for Crunch mip chains.

Each returned `TextureLevel` now exposes:

- `shape`: always `'texture-level'`. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `format`: the corresponding WebGL internal format number. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat`: the corresponding luma.gl / WebGPU-style texture format string. <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />

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

For documentation please visit the [website](https://loaders.gl).
