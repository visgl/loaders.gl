# HDF5

`@loaders.gl/scientific/hdf5` exposes scientific-array source APIs and experimental TypeScript
HDF5 decoding utilities. Install `@loaders.gl/scientific` to use this subpath.

## Open file bytes

```ts
import {openHDF5Source} from '@loaders.gl/scientific/hdf5';

const source = await openHDF5Source(bytes);
try {
  const metadata = await source.getScientificMetadata();
} finally {
  await source.close();
}
```

`openHDF5Source` currently uses `h5wasm`, which is installed as a dependency of scientific.
It accepts complete `ArrayBuffer` or `Uint8Array` input. It is a source-opening function,
not a loader descriptor to pass to core's `load()`.

## Experimental TypeScript reader

`HDF5TypeScriptFile`, `HDF5MemorySource`, and `HTTPRangeReader` provide a separate TypeScript
path for supported numeric datasets. The reader has explicit methods for contiguous and
chunked datasets and supports selected HDF5 structures, filters, and chunk indexes. Unsupported
structures throw; it is not yet a general replacement for the default WASM backend.

The subpath also exports lower-level superblock, object-header, layout, filter, and chunk-reading
helpers. These expose implementation-level HDF5 structures and should be used with their
TypeScript contracts. For NetCDF-4 conventions over HDF5, use the separate
`openNetCDF4Source` API from [scientific/netcdf](../netcdf/README.md).
