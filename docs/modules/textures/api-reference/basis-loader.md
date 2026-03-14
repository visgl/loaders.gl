# BasisLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

A loader for Basis Universal "supercompressed" GPU textures. Extracts supercompressed textures from the basis or ktx2 container and efficiently "transpiles" them into the specified compressed texture format.

| Loader         | Characteristic                                                    |
| -------------- | ----------------------------------------------------------------- |
| File Format    | [Basis Universal](https://github.com/BinomialLLC/basis_universal) |
| File Extension | `.basis`, `.ktx2`                                                 |
| File Type      | Binary                                                            |
| Data Format    | `TextureLevel[][]`                                                |
| Supported APIs | `load`, `parse`                                                   |

## Usage

```typescript
import {BasisLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const miplevels = await load(url, BasisLoader, options);
for (const imageLevels of miplevels) {
  for (const level of imageLevels) {
    console.log(level.format, level.textureFormat);
  }
}
```

## Options

| Option                          | Type                                                                                                                                                                                                                                                                        | Default        | Description                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `basis.format`                  | `'auto' \| 'etc1' \| 'etc2' \| 'bc1' \| 'bc3' \| 'bc4' \| 'bc5' \| 'bc7-m6-opaque-only' \| 'bc7-m5' \| 'pvrtc1-4-rgb' \| 'pvrtc1-4-rgba' \| 'astc-4x4' \| 'atc-rgb' \| 'atc-rgba-interpolated-alpha' \| 'rgba32' \| 'rgb565' \| 'bgr565' \| 'rgba4444' \| {alpha, noAlpha}` | `'auto'`       | Select the transcode target format, or provide separate alpha and non-alpha targets using the same set of format names.       |
| `basis.supportedTextureFormats` | `TextureFormat[]`                                                                                                                                                                                                                                                           | auto-detect    | A list of compressed texture formats that the basis transcoder can select from when transcoding.                              |
| `basis.containerFormat`         | `'auto' \| 'ktx2' \| 'basis'`                                                                                                                                                                                                                                               | `'auto'`       | Select whether the input should be interpreted as a KTX2 container, a raw Basis file, or auto-detected from the data.         |
| `basis.module`                  | `'transcoder' \| 'encoder'`                                                                                                                                                                                                                                                 | `'transcoder'` | Select the wasm module used for decoding. `transcoder` supports `.basis`, while `encoder` supports both `.basis` and `.ktx2`. |

## Output

Each decoded mip level is returned as a `TextureLevel` with:

- `shape`: `'texture-level'` <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `format`: the WebGL internal format enum <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
- `textureFormat`: the WebGPU texture format string corresponding to the format of the data in this texture level <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />

When `basis.format` is `'auto'`, pass `basis.supportedTextureFormats` to select from a known set of target formats. If omitted, `BasisLoader` falls back to internal runtime capability detection.

## Wasm modules

BinomialLCC supplies 2 wasm modules:

- basis_transcoder.wasm (~500 kB);
- basis_encoder.wasm (~1,6 MB).

The modules are forked in the loaders.gl repo story: `modules/textures/src/libs`. The transcoder supports only `.basis` extension whereas the encoder supports `.basis` and `.ktx2` extensions. So the encoder is used to decode `.ktx2` files.

The libraries are loaded during runtime from URLs:

- https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.wasm
- https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.js
- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.wasm
- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.js

## Compressed Texture Formats

The `BasisLoader` can transpile into the following compressed (and uncompressed) texture formats.

| Format                        | Description |
| ----------------------------- | ----------- |
| `etc1`                        |             |
| `etc2`                        |             |
| `bc1`                         |             |
| `bc3`                         |             |
| `bc4`                         |             |
| `bc5`                         |             |
| `bc7-m6-opaque-only`          |             |
| `bc7-m5`                      |             |
| `pvrtc1-4-rgb`                |             |
| `pvrtc1-4-rgba`               |             |
| `astc-4x4`                    |             |
| `atc-rgb`                     |             |
| `atc-rgba-interpolated-alpha` |             |
| `rgba32`                      |             |
| `rgb565`                      |             |
| `bgr565`                      |             |
| `rgba4444`                    |             |

## Module Overrides

Use `options.modules` to override the Basis runtime used by `BasisLoader`.

- `modules.basis`: supply a preloaded Basis transcoder module that resolves to `{BasisFile}`.
- `modules.basisEncoder`: supply a preloaded Basis encoder module that resolves to `{BasisFile, KTX2File, BasisEncoder}`.
- `'basis_transcoder.js'`: override the URL used for the Basis transcoder JavaScript wrapper.
- `'basis_transcoder.wasm'`: override the URL used for the Basis transcoder WebAssembly binary.
- `'basis_encoder.js'`: override the URL used for the Basis encoder JavaScript wrapper.
- `'basis_encoder.wasm'`: override the URL used for the Basis encoder WebAssembly binary.
