NetCDF source

![](/next/images/format-logos/netcdf-logo.png)NetCDF

# Read selected variables without guessing the whole dataset.

The NetCDF source discovers variables, dimensions, attributes, and file metadata before materializing selected numeric slices. It provides a clear boundary between format discovery and raster data access.

[NetCDF format](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/scientific/netcdf/formats/netcdf.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Cloud-native data](https://loaders.gl/next/docs/specifications/cloud-native-geospatial.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/cloud-native-geospatial.md)

The NetCDF query path

## Inspect the header. Choose variables. Materialize a slice.

NetCDF dimensions are not automatically treated as map coordinates. The source reports the file’s structure and lets the application choose variables and named dimension ranges explicitly.

01

Discover

Variables, dimensions, attributes, and file size

02

Select

Named numeric variables and dimension slices

03

Read

Classic or 64-bit-offset data arrays

04

Output

Typed raster data with original metadata

[![Scan supported](https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square)](https://loaders.gl/next/docs/developer-guide/common-scan-architecture)

OGC network Common Data Form (netCDF) standards suite

## Scan support[​](#scan-support "Direct link to Scan support")

Detailed guide

## NetCDF source details

The reference below documents scan support, metadata discovery, slicing, limitations, and the source API.

`NetCDFSource` and `NetCDFSourceLoader` expose NetCDF classic and 64-bit-offset headers through the shared scan architecture. `getQueryMetadata()` discovers variable names, portable scalar types, variable attributes, dimensions, and file size without decoding data arrays. `getRaster()` then reads selected numeric variables and applies named dimension slices.

| Capability                  | Support                               | Execution                                              |
| --------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Entry point                 | ✅ `getRaster()`                      | Typed raster data                                      |
| Header and schema discovery | ✅ Supported                          | Bounded leading range for remote files                 |
| Variable selection          | ✅ Supported                          | Selected numeric variables                             |
| Dimension slices            | ✅ Supported                          | Residual after loading the classic file                |
| Slice syntax                | ✅ Index or half-open `[start, stop)` | Named dimensions                                       |
| Bounds and level-of-detail  | ❌ Unsupported                        | NetCDF dimensions are not assumed to be geospatial     |
| Cancellation                | ✅ Supported                          | Request and cooperative slice materialization          |
| Streaming or chunk pruning  | ❌ Not implemented                    | Current classic-file execution materializes the source |

```
import {NetCDFSource} from '@loaders.gl/scientific/netcdf/netcdf-source-loader';



const source = new NetCDFSource('weather.nc', {});

const metadata = await source.getQueryMetadata();

const raster = await source.getRaster({

  variables: ['temperature'],

  slices: {time: 0, latitude: [20, 60], longitude: [40, 100]}

});
```

Multiple selected variables must retain the same shape and numeric type after slicing. A scalar dimension selection removes that dimension; a range retains it. The original variable and dimension names remain available in the result metadata.
