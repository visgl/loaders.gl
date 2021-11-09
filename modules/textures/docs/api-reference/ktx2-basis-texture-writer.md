# KTX2BasisWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

> The experimental `KTX2BasisUniversalTextureWriter` class can encode a decoded image into a KTX2 texture.

| Loader         | Characteristic                                         |
| -------------- | ------------------------------------------------------ |
| File Extension | `.ktx2`                                                |
| File Type      | Binary                                                 |
| Data Format    | https://github.khronos.org/KTX-Specification           |
| File Format    | KTX2                                                   |
| Encoder Type   | Asynchronous                                           |
| Worker Thread  | No (but may run on separate native thread in browsers) |
| Streaming      | No                                                     |

## Usage

```js
import '@loaders.gl/polyfill'; // only if using under Node
import {load, encode} from '@loaders.gl/core';
import {KTX2BasisUniversalTextureWriter} from '@loaders.gl/textures';

const shannonPNG = 'shannon.png';

const image = await load(shannonPNG, ImageLoader, {image: {type: 'data'}});
const encodedData = await encode(image, KTX2BasisUniversalTextureWriter);
```

## Data Format

https://github.khronos.org/KTX-Specification/

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
