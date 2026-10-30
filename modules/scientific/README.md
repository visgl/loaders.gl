# @loaders.gl/scientific

Scientific array sources and readers for NPY, NetCDF, Zarr, GRIB2, HDF5, and VTK.

Supported formats: NPY, NetCDF, NetCDF-4, Zarr, GeoZarr, OME-Zarr, SpatialData, GRIB2, HDF5, VTK, VTI, VTR, VTS, VTU, VTP. GRIB2, HDF5, NetCDF-4, and VTK readers have the implementation limits documented below.

```bash
npm install @loaders.gl/core @loaders.gl/scientific
```

The package root exports lightweight loader metadata. Async loaders can preload their parser when needed. Import format implementations explicitly when you need a parser or source class directly:

```ts
import {NPYLoader, NetCDFLoader, NetCDFSourceLoader, OMEZarrSourceLoader} from '@loaders.gl/scientific';
import {NPYLoaderWithParser} from '@loaders.gl/scientific/npy-loader';
import {NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf';
import {OMEZarrImageSource, loadZarr} from '@loaders.gl/scientific/zarr';
```

The package groups independently documented formats and adapters:

- [NetCDF](/docs/modules/scientific/netcdf/formats/netcdf): classic NetCDF file parsing and typed raster scans.
- [Zarr](/docs/modules/scientific/zarr/formats/zarr): chunked arrays, GeoZarr, OME-Zarr, and SpatialData sources.
- [GRIB2](./GRIB2.md): initial simple-packing support for gridded data.
- [HDF5 and NetCDF-4](./HDF5-NETCDF4.md): numeric arrays through an HDF5 backend and partial NetCDF-4 semantics.
- [Experimental TypeScript HDF5](./HDF5-TYPESCRIPT.md): a bounded, range-capable reader for selected layouts.
- [VTK](./VTK.md): legacy and XML data readers.
- [Scientific vector fields](./VECTOR-FIELD.md): aligned velocity components from scientific arrays.

Zarr v2 and v3 storage support is provided by the `zarr` and `zarrita` packages, installed as dependencies of `@loaders.gl/scientific`.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
