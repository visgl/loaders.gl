# @loaders.gl/scientific

Scientific data loaders for NetCDF and Zarr formats.

The package root exports metadata-only loaders. Import parser-bearing implementations from the format subpaths when direct parser access is needed:

```ts
import {NetCDFLoader} from '@loaders.gl/scientific';
import {NetCDFLoader as NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf';
```

See the [NetCDF](./netcdf/formats/netcdf.md) and [Zarr](./zarr/formats/zarr.md) format guides for supported features and usage.

## Sources and credits

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scientific/THIRD-PARTY-NOTICES.md)
and the project-wide [References and credits](/docs/references-and-credits).
