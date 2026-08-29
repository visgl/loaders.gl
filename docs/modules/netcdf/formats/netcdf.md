---
title: NetCDF format
description: A scientific array format for named dimensions, variables, attributes, and typed data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Scientific array format"
  title="Keep the dimensions that give data meaning."
  description="NetCDF stores typed multidimensional arrays together with named dimensions and attributes, making time, level, latitude, longitude, and other scientific axes part of the data model."
  tone="cyan"
  meta={['NetCDF classic', 'Multidimensional arrays', 'Remote discovery']}
  links={[
    {label: 'NetCDF API reference', to: '/docs/modules/netcdf/api-reference'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The array model"
  title="Choose the variable and slice the dimensions."
  description="NetCDF is most useful when the axes are meaningful. loaders.gl preserves those names and attributes while allowing a caller to request only a selected numeric variable and half-open dimension ranges."
  tone="cyan"
  items={[
    {label: 'Describe', value: 'Dimensions, variables, attributes, and types'},
    {label: 'Select', value: 'A numeric variable and named dimension slices'},
    {label: 'Read', value: 'The corresponding classic-file ranges'},
    {label: 'Return', value: 'Typed data with original metadata attached'}
  ]}
/>

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/netcdf`](/docs/modules/netcdf/api-reference)_
- _[NetCDF documentation](https://docs.unidata.ucar.edu/netcdf-c/current/)_

NetCDF stores named dimensions, variables, attributes, and typed multidimensional arrays. It is
widely used for weather, climate, ocean, and scientific data where array dimensions carry domain
meaning such as time, pressure level, latitude, and longitude.

<ReferenceBoundary
  title="NetCDF structure and support"
  description="The sections below describe the file variants, source discovery, variable selection, dimension slicing, and current implementation boundaries."
  tone="cyan"
/>

## loaders.gl support

| Format feature | Support |
| --- | --- |
| NetCDF classic | Supported |
| 64-bit-offset files | Supported |
| Header-only remote discovery | Supported with bounded leading range reads |
| Numeric variable reads | Supported |
| Named dimension slicing | Supported |
| NetCDF-4/HDF5 storage | Not supported by this source |
| Automatic CF reprojection or coordinate-to-bounds planning | Not provided |

## Scan support

NetCDF uses the raster query vocabulary because variables and dimension slices are a more accurate
model than relational rows.

| Scan feature | Support |
| --- | --- |
| Entry point | `getRaster()` |
| Metadata | Variables, types, attributes, dimensions, record length, and file size |
| Variable selection | Pushdown to the selected result variables |
| Dimension selection | Named index or half-open `[start, stop)` slice, evaluated residually |
| Bounds and overview level | Unsupported |
| Output | Typed raster data with original variable/dimension metadata |
| Cancellation | Supported |
| Chunk or range pruning during data reads | Not implemented for classic-file execution |
