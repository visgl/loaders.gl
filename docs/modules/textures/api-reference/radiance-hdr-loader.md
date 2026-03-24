# RadianceHDRLoader

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
| Data Format    | [`Texture`](/docs/modules/textures/README#texture-category) |
| Supported APIs | `load`, `parse`, `parseSync` |

## Usage

```typescript
import {RadianceHDRLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const texture = await load(url, RadianceHDRLoader);
const level = texture.data[0];

console.log(texture.type, level.width, level.height);
console.log(texture.format, level.format);
console.log(level.data instanceof Float32Array);
console.log(texture.metadata?.exposure);
```

## Data Format

Returns a `Texture` with `shape: 'texture'`, `type: '2d'`, and one decoded level in `data`.

The returned texture includes:

- `shape: 'texture'`
- `type: '2d'`
- `format: 'rgba32float'`
- `data: TextureLevel[]`
- `metadata?: RadianceHDRMetadata`

## Metadata

When present in the file, `RadianceHDRLoader` exposes application-facing header metadata on `texture.metadata`.

```typescript
type RadianceHDRMetadata = {
  colorCorrection?: [number, number, number];
  exposure?: number;
  gamma?: number;
  pixelAspectRatio?: number;
  primaries?: [number, number, number, number, number, number, number, number];
  software?: string;
  view?: string;
};
```

The loader does not expose internal parsing fields such as normalized scanline orientation or format markers in `metadata`.

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
- `RadianceHDRLoader` decodes standard 2D Radiance RGBE files only.
- The alpha channel is synthesized as `1.0` for every pixel.
