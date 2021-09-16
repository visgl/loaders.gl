# BasisLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

A loader for Basis Universal "supercompressed" GPU textures. Extracts supercompressed textures from the basis container and efficiently "transpiles" them into the specified compressed texture format.

| Loader         | Characteristic                                                    |
| -------------- | ----------------------------------------------------------------- |
| File Format    | [Basis Universal](https://github.com/BinomialLLC/basis_universal) |
| File Extension | `.basis`                                                          |
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
