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

### HTTP range header visibility

The HDF5 HTTP range reader accepts a `206 Partial Content` response with a missing
`Content-Range` header when its body has exactly the requested byte length. This supports
servers whose CORS policy hides range metadata. Visible range headers must still match
requested offsets, and malformed headers, full-file `200` responses and wrong-length
bodies are rejected. Without the header, the reader trusts the server's 206 response
for the byte offset.
