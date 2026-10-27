# @loaders.gl/scientific

Scientific array sources and parsers for NetCDF, Zarr, HDF5, GRIB2, and VTK. Support differs by
format and encoding; the focused references below describe the implementation on master.

```sh
npm install @loaders.gl/core @loaders.gl/scientific
```

| Subpath | Public entry APIs | Reference |
| --- | --- | --- |
| `/netcdf` | `NetCDFLoaderWithParser`, `NetCDFReader`, `NetCDFSource`, `openNetCDF4Source` | [NetCDF](./netcdf/README.md) |
| `/zarr` | OME-Zarr, GeoZarr, generic array, and SpatialData sources | [Zarr](./zarr/README.md) |
| `/hdf5` | `openHDF5Source`, `HDF5Source`, experimental `HDF5TypeScriptFile` | [HDF5](./hdf5/README.md) |
| `/grib2` | `parseGRIB2`, `GRIB2Source` | [GRIB2](./grib2/README.md) |
| `/vtk` | `parseVTKLegacy`, `parseVTKXML` | [VTK](./vtk/README.md) |
| `/scientific-array` | Common scientific-array interfaces and helpers | Shared source contracts |
| `/vector-field` | Vector-field processing helpers | Explicit processing entrypoint |

The root exports NetCDF and Zarr metadata loaders and shared types. It does not re-export every
parser or experimental source. For direct NetCDF parsing:

```ts
import {parse, parseSync} from '@loaders.gl/core';
import {NetCDFLoader} from '@loaders.gl/scientific';
import {NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf';

const result = await parse(bytes, NetCDFLoader);
const synchronousResult = parseSync(bytes, NetCDFLoaderWithParser);
```

The package currently installs `h5wasm`, `zarr`, `zarrita`, and XML parsing support as dependencies.
Subpath imports control which code is loaded, but do not create separate installation units.
