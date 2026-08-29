---
title: GeoTIFF format
description: A TIFF image with metadata that locates raster pixels in a coordinate system.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Georeferenced raster format"
  title="Keep the pixels and their location together."
  description="GeoTIFF combines TIFF image storage with tags that describe the raster’s coordinate system, bounds, scale, and placement. Cloud Optimized GeoTIFF adds a layout that makes bounded reads practical."
  tone="mint"
  meta={['TIFF 6.0', 'GeoTIFF tags', 'COG range reads']}
  links={[
    {label: 'GeoTIFF module', to: '/docs/modules/geotiff'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<GeoTiffDocsTabs active="format" />

<DocOrientation
  eyebrow="A raster has more than pixels"
  title="Read the window, resolution, bands, and reference."
  description="A raster request is naturally spatial. loaders.gl keeps bounds, overviews, bands, and CRS metadata together so a cloud read can select the relevant image ranges."
  tone="mint"
  items={[
    {label: 'Image', value: 'Typed pixel values and dimensions'},
    {label: 'Location', value: 'Bounds, transform, and coordinate reference'},
    {label: 'Selection', value: 'Window, overview, and band choices'},
    {label: 'Delivery', value: 'Local files or HTTP range-readable COGs'}
  ]}
/>

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- _[`@loaders.gl/geotiff`](/docs/modules/geotiff)_
- _[OGC Standard](https://www.ogc.org/standard/geotiff/)_

## GeoTIFF Metadata

GeoTIFF is a public domain metadata standard that enables georeferencing information to be embedded within an image file.
The GeoTIFF format embeds geospatial metadata into image files such as aerial photography, satellite imagery,
and digitized maps so that they can be used in GIS applications.

https://gis.stackexchange.com/questions/62837/understanding-geotiff-tags
http://duff.ess.washington.edu/data/raster/drg/docs/geotiff.txt

## TIFF

TIFF or TIF (Tagged Image Format) is an image file format for storing raster graphics images.

A TIFF file can contain multiple images, with tags pointing to each image.

The latest version is TIFF 6.0 was released on 3 June 1992.

## Scan support

GeoTIFF and Cloud Optimized GeoTIFF participate through the raster side of the [common scan
architecture](/docs/developer-guide/common-scan-architecture). Raster queries keep their natural
window, resolution, and band vocabulary rather than pretending pixels are table rows.

| Capability | GeoTIFF / COG | OME-TIFF |
| --- | --- | --- |
| Entry point | `getRaster()` | `getRaster()` |
| Metadata discovery | Bands, dtype, bounds, CRS, overviews | Channels, dtype, dimensions, multiscale levels |
| Spatial window | Bounds pushdown in the source CRS | Not geospatial |
| Resolution | Overview/target-size selection | Multiscale level selection |
| Components | Band selection | Channel selection plus time and z slices |
| Output | Typed planar or interleaved raster data | Typed image planes |
| Reprojection | Not performed | Not applicable |
| Cancellation | Checked by the source, but not advertised as cooperative raster cancellation | Validated query execution |

COG range access is preserved: a bounded request can select the relevant image and byte ranges
without first downloading the entire file. When a viewport CRS differs from the source CRS, the
source rejects the request rather than silently returning misregistered pixels.

<ReferenceBoundary
  title="TIFF metadata and raster access"
  description="The sections below describe GeoTIFF metadata, TIFF structure, scan behavior, and the boundaries of the current source implementations."
  tone="mint"
/>
