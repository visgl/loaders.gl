# CompressedTextureLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Loader for compressed textures in the PVR file format

| Loader         | Characteristic                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| File Format    | [PVR](http://powervr-graphics.github.io/WebGL_SDK/WebGL_SDK/Documentation/Specifications/PVR%20File%20Format.Specification.pdf), [DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide), [KTX](https://github.com/KhronosGroup/KTX-Software/) |
| File Extension | `.dds`, `.pvr`, `.ktx`, `.ktx2`                                                                                                                                                                                                 |
| File Type      | Binary                                                                                                                                                                                                                          |
| Data Format    | Array of compressed image data objects                                                                                                                                                                                          |
| Supported APIs | `load`, `parse`                                                                                                                                                                                                                 |

## Usage

```typescript
import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const mipLevels = await load(url, CompressedTextureLoader);
for (const image of mipLevels) {
  ...
}
```

## Data Format

Returns an array of image data objects representing mip levels.

`{compressed: true, format, width, height, data: ..., levelSize}`

## Options

| Option                        | Type    | Default | Description                                                                                |
| ----------------------------- | ------- | ------- | ------------------------------------------------------------------------------------------ |
| `compressed-texture.useBasis` | Boolean | `false` | Use [BasisLoader](/docs/modules/textures/api-reference/basis-loader) to decode KTX2 texture |

## Basis loader

From v3.1 [BasisLoader](/docs/modules/textures/api-reference/basis-loader) supports decoding KTX2 format. Applying BasisLoader for KTX2 files can possibly give results when internal ktx parser can't parse an image for some reason.
