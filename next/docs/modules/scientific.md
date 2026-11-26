# @loaders.gl/scientific

Scientific array sources and parsers for NPY, NetCDF, Zarr, HDF5, GRIB2, and VTK. Support differs by format and encoding; the focused references below describe the implementation on master.

```
npm install @loaders.gl/core @loaders.gl/scientific
```

| Logo                                                                                                                                  | Subpath             | Public entry APIs                                                             | Reference                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| —                                                                                                                                     | `/npy-loader`       | `NPYLoaderWithParser`                                                         | [NPYLoader](https://loaders.gl/next/docs/modules/scientific/api-reference/npy-loader.md) |
| [![](/next/images/format-logos/netcdf-logo.png)NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md) | `/netcdf`           | `NetCDFLoaderWithParser`, `NetCDFReader`, `NetCDFSource`, `openNetCDF4Source` | [NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf.md)                      |
| [![](/next/images/format-logos/zarr-logo.svg)Zarr](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md)         | `/zarr`             | OME-Zarr, GeoZarr, generic array, and SpatialData sources                     | [Zarr](https://loaders.gl/next/docs/modules/scientific/zarr.md)                          |
| —                                                                                                                                     | `/hdf5`             | `openHDF5Source`, `HDF5Source`, experimental `HDF5TypeScriptFile`             | [HDF5](https://loaders.gl/next/docs/modules/scientific/hdf5.md)                          |
| —                                                                                                                                     | `/grib2`            | `parseGRIB2`, `GRIB2Source`                                                   | [GRIB2](https://loaders.gl/next/docs/modules/scientific/grib2.md)                        |
| [![](/next/images/format-logos/vtk-logo.png)](https://loaders.gl/next/docs/modules/scientific/vtk.md)                            | `/vtk`              | `parseVTKLegacy`, `parseVTKXML`                                               | [VTK](https://loaders.gl/next/docs/modules/scientific/vtk.md)                            |
| —                                                                                                                                     | `/pdb`              | `PDBLoader`, `PDBLoaderWithParser`                                            | [PDB](https://loaders.gl/next/docs/modules/scientific/pdb.md)                            |
| —                                                                                                                                     | `/scientific-array` | Common scientific-array interfaces and helpers                                | Shared source contracts                                                                       |
| —                                                                                                                                     | `/vector-field`     | Vector-field processing helpers                                               | Explicit processing entrypoint                                                                |

Import scientific loader metadata and types from the format subpath. For direct NetCDF parsing:

```
import {parse, parseSync} from '@loaders.gl/core';

import {NetCDFLoader} from '@loaders.gl/scientific/netcdf';

import {NetCDFLoaderWithParser} from '@loaders.gl/scientific/netcdf/bundled';



const result = await parse(bytes, NetCDFLoader);

const synchronousResult = parseSync(bytes, NetCDFLoaderWithParser);
```

The package currently installs `h5wasm`, `zarr`, `zarrita`, and XML parsing support as dependencies. Subpath imports control which code is loaded, but do not create separate installation units.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/scientific/THIRD-PARTY-NOTICES.md) and the project-wide [Attributions and Credits](https://loaders.gl/next/docs/references-and-credits.md).

`NPYLoader` and `NPYFormat` are metadata exports from the lightweight package root. For parser access use the flat `@loaders.gl/scientific/npy` subpath.

## Format guides[​](#format-guides "Direct link to Format guides")

* [PDB](https://loaders.gl/next/docs/modules/scientific/pdb.md)

* [NRRD](https://loaders.gl/next/docs/modules/scientific/nrrd.md)

* [VTK](https://loaders.gl/next/docs/modules/scientific/vtk.md)

* [NumPy NPY](https://loaders.gl/next/docs/modules/scientific/formats/npy.md)

* [NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md)

* [Zarr, GeoZarr, and OME-Zarr formats](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->24<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                                | Import subpath                            |
| ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
|                                                                                                                                       | `@loaders.gl/scientific/adsb`             |
|                                                                                                                                       | `@loaders.gl/scientific/adsb/bundled`     |
|                                                                                                                                       | `@loaders.gl/scientific/ais`              |
|                                                                                                                                       | `@loaders.gl/scientific/ais/bundled`      |
|                                                                                                                                       | `@loaders.gl/scientific/grib2`            |
|                                                                                                                                       | `@loaders.gl/scientific/hdf5`             |
| [![](/next/images/format-logos/netcdf-logo.png)NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md) | `@loaders.gl/scientific/netcdf`           |
| [![](/next/images/format-logos/netcdf-logo.png)NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md) | `@loaders.gl/scientific/netcdf/api`       |
| [![](/next/images/format-logos/netcdf-logo.png)NetCDF](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md) | `@loaders.gl/scientific/netcdf/bundled`   |
|                                                                                                                                       | `@loaders.gl/scientific/npy`              |
|                                                                                                                                       | `@loaders.gl/scientific/npy-worker.js`    |
|                                                                                                                                       | `@loaders.gl/scientific/npy/bundled`      |
|                                                                                                                                       | `@loaders.gl/scientific/nrrd`             |
|                                                                                                                                       | `@loaders.gl/scientific/nrrd/bundled`     |
|                                                                                                                                       | `@loaders.gl/scientific/pdb`              |
|                                                                                                                                       | `@loaders.gl/scientific/pdb/bundled`      |
|                                                                                                                                       | `@loaders.gl/scientific/scientific-array` |
|                                                                                                                                       | `@loaders.gl/scientific/vector-field`     |
| [![](/next/images/format-logos/vtk-logo.png)](https://loaders.gl/next/docs/modules/scientific/vtk.md)                            | `@loaders.gl/scientific/vtk`              |
| [![](/next/images/format-logos/vtk-logo.png)](https://loaders.gl/next/docs/modules/scientific/vtk.md)                            | `@loaders.gl/scientific/vtk/api`          |
| [![](/next/images/format-logos/vtk-logo.png)](https://loaders.gl/next/docs/modules/scientific/vtk.md)                            | `@loaders.gl/scientific/vtk/bundled`      |
| [![](/next/images/format-logos/zarr-logo.svg)Zarr](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md)         | `@loaders.gl/scientific/zarr`             |
| [![](/next/images/format-logos/zarr-logo.svg)Zarr](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md)         | `@loaders.gl/scientific/zarr/api`         |
| [![](/next/images/format-logos/zarr-logo.svg)Zarr](https://loaders.gl/next/docs/modules/scientific/zarr/formats/zarr.md)         | `@loaders.gl/scientific/zarr/bundled`     |

## Experimental formats[​](#experimental-formats "Direct link to Experimental formats")

* [`/adsb`](https://loaders.gl/next/docs/modules/scientific/adsb.md)
* [`/ais`](https://loaders.gl/next/docs/modules/scientific/ais.md)
* [ADS-B aircraft state JSON](https://loaders.gl/next/docs/modules/scientific/adsb/formats/adsb.md)
* [AIS - Automatic Identification System](https://loaders.gl/next/docs/modules/scientific/ais/formats/ais.md)
