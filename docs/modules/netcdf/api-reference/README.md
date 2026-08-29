---
title: NetCDF source API
description: Discover NetCDF variables and read selected slices as raster data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="NetCDF source"
  title="Read selected variables without guessing the whole dataset."
  description="The NetCDF source discovers variables, dimensions, attributes, and file metadata before materializing selected numeric slices. It provides a clear boundary between format discovery and raster data access."
  tone="cyan"
  meta={['NetCDF classic', 'Variable discovery', 'Dimension slices']}
  links={[
    {label: 'NetCDF format', to: '/docs/modules/netcdf/formats/netcdf'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Cloud-native data', to: '/docs/specifications/cloud-native-geospatial'}
  ]}
/>

<DocOrientation
  eyebrow="The NetCDF query path"
  title="Inspect the header. Choose variables. Materialize a slice."
  description="NetCDF dimensions are not automatically treated as map coordinates. The source reports the file’s structure and lets the application choose variables and named dimension ranges explicitly."
  tone="cyan"
  items={[
    {label: 'Discover', value: 'Variables, dimensions, attributes, and file size'},
    {label: 'Select', value: 'Named numeric variables and dimension slices'},
    {label: 'Read', value: 'Classic or 64-bit-offset data arrays'},
    {label: 'Output', value: 'Typed raster data with original metadata'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

OGC network Common Data Form (netCDF) standards suite

## Scan support

<ReferenceBoundary
  title="NetCDF source details"
  description="The reference below documents scan support, metadata discovery, slicing, limitations, and the source API."
  tone="cyan"
/>

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
