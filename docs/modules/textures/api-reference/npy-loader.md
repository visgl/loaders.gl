---
title: NPYLoader
description: Read NumPy NPY arrays into typed JavaScript data while preserving dtype, order, and shape metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Textures module · API reference"
  title="Bring a NumPy array into a typed JavaScript pipeline."
  description="NPYLoader handles the compact NumPy array format and returns the typed data together with the header metadata needed to interpret its dimensions and storage order."
  tone="blue"
  meta={['.npy', 'Typed arrays', 'Synchronous decoder']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Texture data', to: '/docs/specifications/category-texture'},
    {label: 'Image loaders', to: '/docs/modules/images'}
  ]}
/>

<DocOrientation
  eyebrow="What comes back"
  title="Values plus the metadata that makes them useful."
  description="The loader returns a typed array for the values and a small header describing dtype, Fortran order, and dimensions. The array is ready for application or texture conversion code."
  tone="blue"
  items={[
    {label: 'Data', value: 'TypedArray selected from the NPY descriptor'},
    {label: 'Dtype', value: 'Element kind, width, and byte order'},
    {label: 'Shape', value: 'Dimensions of the multidimensional array'},
    {label: 'Order', value: 'C-order or Fortran-order storage metadata'}
  ]}
/>

<ReferenceBoundary
  title="NPYLoader details"
  description="The reference below covers the supported file shape, usage, returned header fields, and current option boundaries."
  tone="blue"
/>

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

```typescript
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
