# HDRLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Loader for Radiance RGBE `.hdr` textures.

See also: [`Radiance HDR`](/docs/modules/textures/formats/hdr)

| Loader         | Characteristic               |
| -------------- | ---------------------------- |
| File Format    | Radiance HDR / RGBE          |
| File Extension | `.hdr`                       |
| File Type      | Binary                       |
| Data Format    | `Texture`                    |
| Supported APIs | `load`, `parse`, `parseSync` |

## Usage

```typescript
import {HDRLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const texture = await load(url, HDRLoader);
const level = texture.data[0];

console.log(texture.type, level.width, level.height);
console.log(texture.format, texture.glFormat);
console.log(level.data instanceof Float32Array);
```

## Data Format

Returns a `Texture` with `shape: 'texture'`, `type: '2d'`, and one decoded level in `data`.

The returned texture includes:

- `shape: 'texture'`
- `type: '2d'`
- `format: 'rgba32float'`
- `glFormat: GL_RGBA32F`
- `data: TextureLevel[]`

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

- File format background: [`Radiance HDR`](/docs/modules/textures/formats/hdr)
- `HDRLoader` decodes standard 2D Radiance RGBE files only.
- The alpha channel is synthesized as `1.0` for every pixel.
