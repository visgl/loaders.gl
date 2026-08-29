---
title: GeoTIFFLoader
description: Read georeferenced TIFF imagery and its spatial metadata.
hide_title: true
page_style: designed
---

import {GeoTiffDocsTabs} from '@site/src/components/docs/geotiff-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoTIFF loader"
  title="Read raster values with their spatial context."
  description="GeoTIFFLoader is the entry point for TIFF imagery whose tags describe scale, bounds, and coordinate reference. Use the source APIs when a cloud query needs selective ranges or windows."
  tone="mint"
  meta={['TIFF input', 'GeoTIFF metadata', 'Typed raster output']}
  links={[
    {label: 'GeoTIFF format', to: '/docs/modules/geotiff/formats/geotiff'},
    {label: 'GeoTIFF module', to: '/docs/modules/geotiff'}
  ]}
/>

<GeoTiffDocsTabs active="geotiffloader" />

<DocOrientation
  eyebrow="Loader or source?"
  title="Load a complete image, or query a remote raster."
  description="The loader is the simple complete-file path. GeoTIFFSourceLoader adds metadata discovery, range reads, windows, overview selection, and cancellation for cloud-native access."
  tone="mint"
  items={[
    {label: 'Loader', value: 'Complete TIFF image and metadata'},
    {label: 'Source', value: 'Bounded windows and HTTP ranges'},
    {label: 'Output', value: 'Typed image data with dimensions'},
    {label: 'Metadata', value: 'Tags, transform, bounds, and CRS'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

TBA

<ReferenceBoundary
  title="GeoTIFF loader details"
  description="The implementation details and future coverage notes for GeoTIFFLoader follow below."
  tone="mint"
/>
