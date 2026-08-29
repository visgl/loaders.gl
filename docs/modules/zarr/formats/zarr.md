---
title: Zarr, GeoZarr, and OME-Zarr formats
description: Store typed multidimensional arrays as independently addressable chunks.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Chunked multidimensional data"
  title="Read the array chunks that answer the question."
  description="Zarr stores typed multidimensional arrays in independently addressable chunks. OME-Zarr and GeoZarr add conventions for images, coordinates, dimensions, transforms, and spatial metadata."
  tone="pink"
  meta={['Zarr v2 and v3', 'Chunked arrays', 'OME-Zarr and GeoZarr']}
  links={[
    {label: 'Zarr module', to: '/docs/modules/zarr'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The array boundary"
  title="Keep the dimensions named and the chunks independent."
  description="The storage model stays multidimensional. loaders.gl can discover variables and dimensions, select windows or levels, and return typed raster data without flattening away the array’s meaning."
  tone="pink"
  items={[
    {label: 'Storage', value: 'Typed arrays split into addressable chunks'},
    {label: 'Conventions', value: 'OME-Zarr, GeoZarr, CF, and xarray metadata'},
    {label: 'Selection', value: 'Windows, channels, levels, and named slices'},
    {label: 'Output', value: 'Typed raster data with dimension metadata'}
  ]}
/>

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/zarr`](/docs/modules/zarr)_
- _[Zarr specification](https://zarr-specs.readthedocs.io/)_
- _[OME-Zarr specification](https://ngff.openmicroscopy.org/)_

Zarr stores typed multidimensional arrays as independently addressable chunks. OME-Zarr adds
bioimaging conventions such as multiscale image pyramids, channels, and labeled dimensions.
GeoZarr and CF/xarray conventions add coordinate reference systems, transforms, coordinate arrays,
and named scientific dimensions.

<ReferenceBoundary
  title="Array conventions and scan behavior"
  description="The sections below compare Zarr generations and conventions, then describe chunk selection and raster query behavior."
  tone="pink"
/>

## Format support

| Capability | Zarr v2 | Zarr v3 | OME-Zarr | GeoZarr / CF |
| --- | --- | --- | --- | --- |
| Metadata discovery | Supported | Supported | Supported | Supported |
| Chunk reads and codecs | Supported | Supported | Supported | Supported |
| Multidimensional arrays | Supported | Supported | Supported | Supported |
| Multiscale image levels | Format-specific | Format-specific | Supported | Not assumed |
| Spatial CRS and transform | Not inherent | Not inherent | Not required | Supported |
| Named time/z/band selection | Array-dependent | Array-dependent | Supported | Supported |

## Scan support

| Scan feature | OME-Zarr | GeoZarr / CF |
| --- | --- | --- |
| Entry point | `getRaster()` | `getRaster()` |
| Discovery | Channels, dimensions, levels | Variable, dtype, dimensions, bounds, CRS |
| Spatial selection | Image window | Native-CRS viewport window |
| Resolution | Multiscale level pushdown | Native resolution |
| Non-spatial selection | Channels, time, z | Named dimension indices |
| Physical access | Selected chunks | Selected chunks |
| Output | Typed image data | Typed raster data |
| Reprojection | Not applicable to ordinary image coordinates | Not performed |

The common contract standardizes discovery and query meaning; it does not hide the array's native
dimension labels, chunk layout, or coordinate system.
