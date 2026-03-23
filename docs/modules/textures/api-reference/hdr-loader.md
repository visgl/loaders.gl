# HDRLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Loader for Radiance RGBE `.hdr` textures.

| Loader         | Characteristic               |
| -------------- | ---------------------------- |
| File Format    | Radiance HDR / RGBE          |
| File Extension | `.hdr`                       |
| File Type      | Binary                       |
| Data Format    | `TextureLevel[]`             |
| Supported APIs | `load`, `parse`, `parseSync` |

## Usage

```typescript
import {HDRLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const textureLevels = await load(url, HDRLoader);
const level = textureLevels[0];

console.log(level.width, level.height);
console.log(level.format, level.textureFormat);
console.log(level.data instanceof Float32Array);
```

## Data Format

Returns `TextureLevel[]` with one decoded level.

The returned level includes:

- `shape: 'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `compressed: false`
- `format: GL_RGBA32F`
- `textureFormat: 'rgba32float'`
- `width`
- `height`
- `data: Float32Array`
- `levelSize`

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |

## Notes

- `HDRLoader` decodes standard 2D Radiance RGBE files only.
- The alpha channel is synthesized as `1.0` for every pixel.
- `loadImageTexture`, `loadImageTextureArray`, and `loadImageTextureCube` remain based on `@loaders.gl/images` in this release.
