Scientific array format

[NPY](https://loaders.gl/next/docs/modules/scientific/formats/npy.md)

# NumPy NPY

Load numeric array values together with dtype, dimensions, and storage-order metadata.

[NPYLoader](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md)[Scientific module](https://loaders.gl/next/docs/modules/scientific.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific.md)

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

| Type   | API                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------- |
| Loader | [`NPYLoader`](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md) |

NPY stores one NumPy array with a header describing its dtype, shape, and Fortran-order flag. `NPYLoader` returns `{header, data}` without turning the array into an image or reordering values. The native parser's supported numeric dtypes and behavior remain unchanged by its move from images. Use the [loader reference](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md) for usage and options.

The reader retains its existing supported header and primitive dtype subset. Structured/object dtypes and Fortran-order (`True`) headers are not currently supported; no Python code is evaluated.
