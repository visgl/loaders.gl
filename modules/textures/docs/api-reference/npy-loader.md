# NPYLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `NPYLoader` parses an array from the [NPY format][npy-spec], a lightweight encoding of multidimensional arrays used by the Python NumPy library.

[npy-spec]: https://numpy.org/doc/stable/reference/generated/numpy.lib.format.html

| Loader                | Characteristic               |
| --------------------- | ---------------------------- |
| File Extension        | `.npy`                       |
| File Type             | Binary                       |
| File Format           | Array                        |
| Data Format           | Array                        |
| Supported APIs        | `load`, `parse`, `parseSync` |
| Decoder Type          | Synchronous                  |
| Worker Thread Support | Yes                          |
| Streaming Support     | No                           |

## Usage

```js
import {_NPYLoader} from '@loaders.gl/textures';
import {load} from '@loaders.gl/core';

const {data, header} = await load(url, _NPYLoader);
```

`data` is a TypedArray containing the array's data.

`header` is an object with three keys:

- `descr`: a string describing the data type. E.g. `|u1` refers to `uint8` and `<u2` refers to little-endian `uint16`. Full details are available in the [NumPy documentation][numpy-dtype-docs].
- `fortran_order`: a boolean that is `true` if the array is stored in Fortran order instead of C order.
- `shape`: an array of integers that describes the shape of the array. The length of the array corresponds to the number of dimensions of the array.

[numpy-dtype-docs]: https://numpy.org/doc/stable/reference/arrays.dtypes.html

## Options

Currently no options are supported for this loader.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
