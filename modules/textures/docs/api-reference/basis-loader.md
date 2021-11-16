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
| Data Format    | Array of compressed image data objects                            |
| Supported APIs | `load`, `parse`                                                   |

## Usage

```js
import {BasisLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const miplevels = await load(url, BasisLoader, options);
for (const compressedImage of miplevels) {
  ...
}
```

## Options

| Option                  | Type   | Default        | Description                                                                                                                                                                                           |
| ----------------------- | ------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `basis.format`          | String | `'auto'`       | Set to one of the supported compressed texture formats.                                                                                                                                               |
| `basis.containerFormat` | String | `'auto'`       | BasisLoader can decode KTX2 container. `ktx2` - decode data as KTX2 container with basis texture in it, `basis` - decode data as unwrapped basis texture, `auto` - detect KTX2 format by magic string |
| `basis.module`          | String | `'transcoder'` | Possible values: `transcoder` or `encoder`. Selects wasm module to decode the texture. `transcoder` is smaller but supports only `BasisFile`. `encoder` supports `BasisFile` and `KTX2File`.          |

## Wasm modules

BinomialLCC supplies 2 wasm modules:

- basis_transcoder.wasm (~500 kB);
- basis_encoder.wasm (~1,6 MB).

The modules are forked in the loaders.gl repo story: `modules/textures/src/libs`. The transcoder supports only `.basis` extension whereas the encoder supports `.basis` and `.ktx2` extensions. So the encoder is used to decode `.ktx2` files.

The libraries are loaded during runtime from URLs: 
* https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.wasm
* https://unpkg.com/@loaders.gl/textures@{VERSION}/dist/libs/basis_transcoder.js
* https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.wasm
* https://unpkg.com/@loaders.gl/textures@${VERSION}/dist/libs/basis_encoder.js

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
