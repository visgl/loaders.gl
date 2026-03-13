# CompressedTextureLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed texture containers in the KTX, DDS and PVR formats.

| Loader         | Characteristic                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format    | [PVR](http://powervr-graphics.github.io/WebGL_SDK/WebGL_SDK/Documentation/Specifications/PVR%20File%20Format.Specification.pdf), [DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide), [KTX](https://github.com/KhronosGroup/KTX-Software/) |
| File Extension | `.dds`, `.pvr`, `.ktx`, `.ktx2`                                                                                                                                                                                                                                                 |
| File Type      | Binary                                                                                                                                                                                                                                                                          |
| Data Format    | `TextureLevel[]`                                                                                                                                                                                                                                                                |
| Supported APIs | `load`, `parse`                                                                                                                                                                                                                                                                 |

## Usage

```typescript
import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CompressedTextureLoader);
for (const level of mipLevels) {
  console.log(level.shape, level.format, level.textureFormat);
}
```

## Data Format

Returns `TextureLevel[]`, one entry per mip level.

Each level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed`
- `format` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `width`
- `height`
- `data`
- `levelSize` when available

## Options

| Option                        | Type    | Default | Description                                                                                 |
| ----------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------- |
| `compressed-texture.useBasis` | Boolean | `false` | Use [BasisLoader](/docs/modules/textures/api-reference/basis-loader) to decode KTX2 texture |

## Basis loader

Use [BasisLoader](/docs/modules/textures/api-reference/basis-loader) for KTX2 assets that need Basis transcoding.
