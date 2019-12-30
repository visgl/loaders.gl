# BasisLoader

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
import {BasisLoader} from '@loaders.gl/basis';
import {load} from '@loaders.gl/core';

const miplevels = await load(url, BasisLoader, options);
for (const compressedImage of miplevels) {
  ...
}
```

## Options

| Option         | Type   | Default  | Description                                  |
| -------------- | ------ | -------- | -------------------------------------------- |
| `basis.format` | String | `'auto'` | Set to one of the supported texture formats. |

## Compressed Texture Formats

The `BasisLoader` can transpile into the following compressed and uncompressed texture formats.

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

## Remarks
