# HDF5 and NetCDF-4

The HDF5 and NetCDF-4 APIs are available through `@loaders.gl/scientific/hdf5` and `@loaders.gl/scientific/netcdf`. They share the scientific array selection contract while keeping file decoding and NetCDF semantics separate.

## HDF5 backend

`HDF5Source` accepts an `HDF5Backend` that enumerates datasets and reads numeric typed arrays. It exposes named dimensions and half-open selections. A backend may implement `readSelection` to push a hyperslab down to storage; otherwise `HDF5Source` reads the full array and slices it in memory.

`openHDF5Source(bytes)` opens an HDF5 file using `h5wasm`. This path buffers the entire file in the WASM virtual filesystem, enumerates nested groups, and reads supported numeric datasets. `h5wasm` is a package dependency of `@loaders.gl/scientific` in this release.

`HTTPRangeReader` validates `206` responses, `Content-Range`, and exact byte counts. It is a transport primitive used by the experimental TypeScript reader. The `h5wasm` backend does not use it and does not offer remote range-backed reads or chunk-level selection pushdown.

## NetCDF-4 adapter

`NetCDF4Source` wraps an HDF5 backend. `readScientificVariable` returns raw values; `readCFVariable` opt-in decodes supported numeric CF scale, offset, fill, missing-value, and valid-range attributes. `openNetCDF4Source(bytes)` uses the `h5wasm` backend.

This is partial NetCDF-4 support. Shared dimension scales, coordinate variables, calendars, CRS/grid mappings, bounds, unsigned packed values, flag variables, strings and compound types, and broad conformance testing remain open. The existing NetCDF classic loader is unchanged.

The experimental pure TypeScript HDF5 subset and its remaining format limits are described in [HDF5-TYPESCRIPT.md](./HDF5-TYPESCRIPT.md).
