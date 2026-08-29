---
title: Standards support
description: See which geospatial standards loaders.gl recognizes, reads, writes, or exposes through service APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Standards and specifications"
  title="Use standards without hiding their boundaries."
  description="The support matrix separates implemented formats, service protocols, developing specifications, and intentionally specialized APIs so compatibility is easy to inspect."
  tone="violet"
  meta={['OGC formats', 'Web services', 'Capability matrix']}
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<DocOrientation
  eyebrow="How to read the matrix"
  title="A standard name is not a blanket promise."
  description="Support is recorded at the format, protocol, and capability level. Follow the linked module or specification for the exact version, profile, and execution boundary."
  tone="violet"
  items={[
    {label: 'Implemented', value: 'A loader, writer, or source exposes the format'},
    {label: 'Protocol', value: 'A service API may require metadata and follow-up requests'},
    {label: 'Developing', value: 'Useful support exists while the specification evolves'},
    {label: 'Boundary', value: 'Unsupported features remain visible in the tables'}
  ]}
/>

<ReferenceBoundary
  title="Standards and capability tables"
  description="The detailed matrix below lists OGC formats, web protocols, and non-OGC formats with their current loaders.gl entry points."
  tone="violet"
/>

## OGC Formats

| Format                                                                       | Module                   | Description                                          |
| ---------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------- |
| KML                                                                          | `@loaders.gl/kml`        |
| GeoPackage                                                                   | `@loaders.gl/geopackage` |
| [**GML**](/docs/modules/wms/formats/gml) (Geographic Markup Language) format | `@loaders.gl/wms`        | an XML grammar that describes geographical features. |
| WKT                                                                          | `@loaders.gl/wkt`        |
| WKB                                                                          | `@loaders.gl/wkt`        |
| WKT-CRS                                                                      | `@math.gl/proj4`         |                                                      |
| 3D Tiles                                                                     | `@loaders.gl/3d-tiles`   |                                                      |
| I3S                                                                          | `@loaders.gl/i3s`        |                                                      |

Developing standards

| Format     |
| ---------- |
| GeoParquet |
| Flatgeobuf |

## OGC Web Standards

| OGC Protocols                                                                   | Supported         | Description                                                                                                                          |
| ------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [**CSW**](/docs/modules/wms/formats/csw) (Catalog Service for the Web) protocol | `@loaders.gl/wms` | protocol for reading a catalog of geospatial assets and services from a URL.                                                         |
| [**WMS**](/docs/modules/wms/formats/wms) (Web Map Service) protocol             | `@loaders.gl/wms` | protocol for serving geo-referenced map images over the internet.                                                                    |
| [**WFS**](/docs/modules/wms/formats/wfs) (Web Feature Service) protocol         | `@loaders.gl/wms` | protocol for serving geo-referenced map features (geometries) over the internet.                                                     |
| [**WMTS**](/docs/modules/wms/formats/wmts) (Web Map Tile Service) protocol      | `@loaders.gl/wms` | protocol for serving pre-rendered or run-time computed georeferenced map tiles over the Internet.                                    |
| **WCS** (Web Coverage Service)                                                  | No                | Load coverage data (e.g. geotiff images for satellite data) from a server.                                                           |
| **WMC**                                                                         | No                | Used in WMS clients to save the configuration of maps and to load them again later. Can also be exchanged between different clients. |
| **OWS Context**                                                                 | No                | Allows configured information resources to be passed between applications primarily as a collection of services.                     |

## Non-Standards

| Format                                                                                |
| ------------------------------------------------------------------------------------- | ----------------------- | --- |
| Shapefile                                                                             | `@loaders.gl/shapefile` |
| [**LERC**](/docs/modules/lerc/formats/lerc) (Limited Error Raster Compression) format | `@loaders.gl/wms`       | .   |
