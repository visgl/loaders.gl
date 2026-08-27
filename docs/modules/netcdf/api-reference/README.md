# NetCDF - Network Common Data Form

![ogc-logo](../../../images/logos/ogc-logo-60.png)

OGC network Common Data Form (netCDF) standards suite

## Scan metadata

`NetCDFSource` and `NetCDFSourceLoader` expose NetCDF classic and 64-bit-offset headers through
the shared scan architecture. `getQueryMetadata()` discovers variable names, portable scalar
types, variable attributes, dimensions, and file size without decoding data arrays. This makes
NetCDF files usable by source-neutral query panels today; projection, filtering, limits, and
chunked slice reads are intentionally reported as unsupported until a data-scan executor is added.

```ts
import {NetCDFSource} from '@loaders.gl/netcdf/netcdf-source-loader';

const source = new NetCDFSource('weather.nc', {});
const metadata = await source.getQueryMetadata();
console.log(metadata.columns, metadata.schema.metadata);
```
