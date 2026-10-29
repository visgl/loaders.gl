Textures module · API reference

GPU

# Bring a NumPy array into a typed JavaScript pipeline.

NPYLoader handles the compact NumPy array format and returns the typed data together with the header metadata needed to interpret its dimensions and storage order.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Texture data](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)[Image loaders](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)

What comes back

## Values plus the metadata that makes them useful.

The loader returns a typed array for the values and a small header describing dtype, Fortran order, and dimensions. The array is ready for application or texture conversion code.

01

Data

TypedArray selected from the NPY descriptor

02

Dtype

Element kind, width, and byte order

03

Shape

Dimensions of the multidimensional array

04

Order

C-order or Fortran-order storage metadata

Detailed guide

## NPYLoader details

The reference below covers the supported file shape, usage, returned header fields, and current option boundaries.

# NPYLoader

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)

The `NPYLoader` parses an array from the [NPY format](https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html), a lightweight encoding of multidimensional arrays used by the Python NumPy library.

| NPYLoader         |                              |
| ----------------- | ---------------------------- |
| File Extension    | `.npy`                       |
| File Type         | Binary                       |
| File Format       | Array                        |
| Data Format       | Array                        |
| Supported APIs    | `load`, `parse`, `parseSync` |
| Decoder Type      | Synchronous                  |
| Worker Thread     | ✅ Yes                       |
| Streaming Support | ❌ No                        |

## Usage[​](#usage "Direct link to Usage")

```
import {NPYLoader} from '@loaders.gl/textures';

import {load} from '@loaders.gl/core';



const {data, header} = await load(url, NPYLoader);
```

`data` is a TypedArray containing the array's data.

`header` is an object with three keys:

* `descr`: a string describing the data type. E.g. `|u1` refers to `uint8` and `<u2` refers to little-endian `uint16`. Full details are available in the [NumPy documentation](https://numpy.org/doc/stable/reference/arrays.dtypes.html).
* `fortran_order`: a boolean that is `true` if the array is stored in Fortran order instead of C order.
* `shape`: an array of integers that describes the shape of the array. The length of the array corresponds to the number of dimensions of the array.

## Options[​](#options "Direct link to Options")

Currently no options are supported for this loader.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
