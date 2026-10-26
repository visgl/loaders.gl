# NetCDF

Install `@loaders.gl/scientific` and import `NetCDFLoader` from its root for asynchronous parsing
of the supported classic NetCDF formats. Direct parsing and source APIs are exported from
`@loaders.gl/scientific/netcdf`.

```ts
import {parse} from '@loaders.gl/core';
import {NetCDFLoader} from '@loaders.gl/scientific';

const dataset = await parse(bytes, NetCDFLoader);
```

- [NetCDF format](./formats/netcdf.md) describes the format and its encodings.
- [NetCDFLoader](./api-reference/README.md) describes the classic file parser.
- HDF5-backed NetCDF-4 uses the separate `openNetCDF4Source` API from
  `@loaders.gl/scientific/netcdf`. Its current HDF5 path uses the WASM backend described in
  [HDF5](../hdf5/README.md); the classic metadata loader does not select it automatically.

Use `NetCDFLoaderWithParser` from the format subpath when calling `parseSync`.
