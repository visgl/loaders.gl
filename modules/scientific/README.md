# @loaders.gl/scientific

Scientific and multidimensional data formats for loaders.gl.

```bash
npm install @loaders.gl/core @loaders.gl/scientific
```

The package root exports lightweight loader metadata. Async loaders can preload their parser when needed. Import format implementations explicitly when you need a parser or source class directly:

```ts
import {NetCDFLoader, NetCDFSourceLoader, OMEZarrSourceLoader} from '@loaders.gl/scientific';
import {NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf';
import {OMEZarrImageSource, loadZarr} from '@loaders.gl/scientific/zarr';
```

The package groups two independently documented formats:

- [NetCDF](/docs/modules/scientific/netcdf/formats/netcdf): classic NetCDF file parsing and typed raster scans.
- [Zarr](/docs/modules/scientific/zarr/formats/zarr): chunked arrays, GeoZarr, OME-Zarr, and SpatialData sources.

Zarr v2 and v3 storage support is provided by the `zarr` and `zarrita` packages, installed as dependencies of `@loaders.gl/scientific`.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
