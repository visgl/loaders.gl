# KTX2BasisWriter 🚧

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

> The experimental `KTX2BasisUniversalTextureWriter` class can encode a decoded image into a KTX2 texture.

| Loader         | Characteristic                                                           |
| -------------- | ------------------------------------------------------------------------ |
| File Extension | `.ktx2`                                                                  |
| File Type      | Binary                                                                   |
| Data Format    | https://github.com/KhronosGroup/KTX-Specification/blob/main/ktxspec.adoc |
| File Format    | KTX2                                                                     |
| Encoder Type   | Asynchronous                                                             |
| Worker Thread  | No (but may run on separate native thread in browsers)                   |
| Streaming      | No                                                                       |

## Usage

```typescript
import '@loaders.gl/polyfill'; // only if using under Node
import {load, encode} from '@loaders.gl/core';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {KTX2BasisUniversalTextureWriter} from '@loaders.gl/textures';

const shannonPNG = 'shannon.png';

const image = getImageData(await load(shannonPNG, ImageBitmapLoader));
const encodedData = await encode(image, KTX2BasisUniversalTextureWriter);
```

## Data Format

https://github.com/KhronosGroup/KTX-Specification/blob/main/ktxspec.adoc

## Options

| Option       | Type    | Default | Description                                                                                                 |
| ------------ | ------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| useSRGB      | Boolean | `false` | If true, the input is assumed to be in sRGB space.                                                          |
| qualityLevel | Number  | 10      | Sets the ETC1S encoder's quality level, which controls the file size vs. quality tradeoff. Range is [1,255] |
| encodeUASTC  | Boolean | `false` | If true, the encoder will output a UASTC texture, otherwise a ETC1S texture.                                |
| mipmaps      | Boolean | `false` | If true mipmaps will be generated from the source images                                                    |

## WASM module

The writer applies BinomialLCC basis universal encoder. The libraries are loaded during runtime from URLs:

- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.wasm
- https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.js

## Module Overrides

Use `options.modules` to override the Basis encoder runtime used by `KTX2BasisUniversalTextureWriter`.

- `modules.basisEncoder`: supply a preloaded Basis encoder module that resolves to `{BasisFile, KTX2File, BasisEncoder}`.
- `'basis_encoder.js'`: override the URL used for the Basis encoder JavaScript wrapper.
- `'basis_encoder.wasm'`: override the URL used for the Basis encoder WebAssembly binary.
