# GRIB2 initial scientific source

Import `GRIB2Source` or `parseGRIB2` from `@loaders.gl/scientific/grib2`.
The initial decoder accepts complete in-memory GRIB2 edition 2 messages with regular
latitude/longitude grid template 3.0, product template 4.0 and simple packing 5.0.
Bitmap indicator 0 or 255 is supported. Missing values are NaN.

This is deliberately **not** general GRIB2 support. Complex packing, JPEG2000, PNG,
spectral grids, reduced Gaussian grids, spatial differencing, forecast metadata beyond
the basic parameter identifiers, and range-backed reads remain unsupported and throw.
The output preserves encoded scan order; consumers must interpret scanningMode before
geographic sampling. Forecast time units and level semantics are not yet normalized.

The shared `ScientificArraySource` interface lives in
`@loaders.gl/scientific/scientific-array`. Existing NetCDF and Zarr adapters should
implement it in follow-up work. No claims of conformance are made without external
reference fixtures and tests.
