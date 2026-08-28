# NetCDF - Network Common Data Form

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

OGC network Common Data Form (netCDF) standards suite

## Scan support

`NetCDFSource` and `NetCDFSourceLoader` expose NetCDF classic and 64-bit-offset headers through
the shared scan architecture. `getQueryMetadata()` discovers variable names, portable scalar
types, variable attributes, dimensions, and file size without decoding data arrays. `getRaster()`
then reads selected numeric variables and applies named dimension slices.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `getRaster()` | Typed raster data |
| Header and schema discovery | Supported | Bounded leading range for remote files |
| Variable selection | Supported | Selected numeric variables |
| Dimension slices | Supported | Residual after loading the classic file |
| Slice syntax | Index or half-open `[start, stop)` | Named dimensions |
| Bounds and level-of-detail | Unsupported | NetCDF dimensions are not assumed to be geospatial |
| Cancellation | Supported | Request and cooperative slice materialization |
| Streaming or chunk pruning | Not implemented | Current classic-file execution materializes the source |

```ts
import {NetCDFSource} from '@loaders.gl/netcdf/netcdf-source-loader';

const source = new NetCDFSource('weather.nc', {});
const metadata = await source.getQueryMetadata();
const raster = await source.getRaster({
  variables: ['temperature'],
  slices: {time: 0, latitude: [20, 60], longitude: [40, 100]}
});
```

Multiple selected variables must retain the same shape and numeric type after slicing. A scalar
dimension selection removes that dimension; a range retains it. The original variable and
dimension names remain available in the result metadata.
