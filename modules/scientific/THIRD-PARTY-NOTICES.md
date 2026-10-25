# @loaders.gl/scientific: sources and credits

[cheminfo/netcdfjs](https://github.com/cheminfo/netcdfjs) supplies adapted NetCDF parsing in [src/netcdf/netcdfjs](./src/netcdf/netcdfjs), retaining the [MIT license](./src/netcdf/netcdfjs/LICENSE). The local [IOBuffer](./src/netcdf/iobuffer/iobuffer.ts) implementation comes from the [IOBuffer project](https://github.com/image-js/iobuffer); [full MIT license](./third-party-licenses/iobuffer-LICENSE).

Zarr integrations use separately installed [zarrita.js](https://github.com/manzt/zarrita.js) and the legacy [zarr.js](https://github.com/gzuidhof/zarr.js). Zarr and OME-NGFF communities define storage and multiscale metadata. Dataset authors are credited independently in the repository fixtures and examples.

The GRIB2 simple-packing decoder and shared scientific-array contract are developed by vis.gl contributors. The World Meteorological Organization defines GRIB; format design is separate from this implementation.

## Scope and maintenance

Original loaders.gl contributions are covered by [LICENSE](./LICENSE). The upstream
notices above apply to their respective portions and do not change those terms.
Source adaptations, separately installed libraries, format definitions and test
data are different contributions. This index is not a transitive dependency
bill of materials. Runtime dependencies can bring additional notices.

Version information is recorded where the repository preserves it. Unpinned
historical ports are identified by retained source and Git history; no upstream
version is inferred from a current dependency. Keep copyright headers, full
terms, source/version information and material modification notes when updating.
Retain this file and the applicable licenses when redistributing bundles or workers.
