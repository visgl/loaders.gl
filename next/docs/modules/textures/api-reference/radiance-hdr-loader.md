Texture API / HDR loader

HDR

# Load lighting data without flattening its range.

RadianceHDRLoader reads RGBE `.hdr` files and returns texture levels with floating-point samples and format metadata. Exposure, tone mapping, and environment use remain decisions for the application or renderer.

[Radiance HDR format](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Image category](https://loaders.gl/next/docs/specifications/category-image.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-image.md)

HDR[HDR](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)[RadianceHDRLoader](https://loaders.gl/next/docs/modules/textures/api-reference/radiance-hdr-loader.md)

HDR decode path

## Return texture data; leave display policy to the renderer.

The loader expands RGBE values into a usable texture representation. Applications can then select environment mapping, filtering, exposure, and tone mapping according to the scene.

01

Detect

Read Radiance HDR headers and scanline-encoded data.

02

Expand

Decode shared-exponent RGBE pixels.

03

Return

Expose dimensions, levels, formats, and floating-point data.

04

Render

Apply application-specific lighting and display policy.

Detailed guide

## RadianceHDRLoader reference

The detailed reference covers input detection, decoded texture levels, RGBE values, options, and common rendering uses.

![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)

Loader for Radiance RGBE `.hdr` textures.

See also: [`Radiance HDR`](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)

| RadianceHDRLoader |                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------- |
| File Format       | Radiance HDR / RGBE                                                                 |
| File Extension    | `.hdr`                                                                              |
| File Type         | Binary                                                                              |
| Data Format       | [`Texture`](https://loaders.gl/next/docs/modules/textures.md#texture-category) |
| Supported APIs    | `load`, `parse`, `parseSync`                                                        |

## Usage[​](#usage "Direct link to Usage")

```
import {RadianceHDRLoader} from '@loaders.gl/textures';

import {load} from '@loaders.gl/core';



const texture = await load(url, RadianceHDRLoader);

const level = texture.data[0];



console.log(texture.type, level.width, level.height);

console.log(texture.format, level.format);

console.log(level.data instanceof Float32Array);

console.log(texture.metadata?.exposure);
```

## Data Format[​](#data-format "Direct link to Data Format")

Returns a `Texture` with `shape: 'texture'`, `type: '2d'`, and one decoded level in `data`.

The returned texture includes:

* `shape: 'texture'`
* `type: '2d'`
* `format: 'rgba32float'`
* `data: TextureLevel[]`
* `metadata?: RadianceHDRMetadata`

## Metadata[​](#metadata "Direct link to Metadata")

When present in the file, `RadianceHDRLoader` exposes application-facing header metadata on `texture.metadata`.

```
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

* `shape: 'texture-level'` ![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)
* `compressed: false`
* `format: GL_RGBA32F`
* `textureFormat: 'rgba32float'`
* `width`
* `height`
* `data: Float32Array`
* `levelSize`

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |

## Notes[​](#notes "Direct link to Notes")

* File format background: [`Radiance HDR`](https://loaders.gl/next/docs/modules/textures/formats/hdr.md)
* `RadianceHDRLoader` decodes standard 2D Radiance RGBE files only.
* The alpha channel is synthesized as `1.0` for every pixel.
