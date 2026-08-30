---
title: WKBWriter
description: Encode loaders.gl geometry as compact OGC Well-Known Binary.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry writer"
  title="WKBWriter"
  description="Encode structured geometry as compact Well-Known Binary for database, GIS, Shapefile, and Arrow-oriented data paths."
  tone="orange"
  meta={['From v2.2', 'OGC WKB', 'Binary output']}
  links={[
    {label: 'WKB format', to: '/docs/modules/wkt/formats/wkb'},
    {label: 'WKBLoader', to: '/docs/modules/wkt/api-reference/wkb-loader'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Put geometry into a compact, widely understood encoding."
  description="WKBWriter is the binary counterpart to WKBLoader. It preserves geometry structure while leaving feature attributes and table metadata to the surrounding application."
  tone="orange"
  items={[
    {label: 'Input', value: 'Structured geometry objects'},
    {label: 'Output', value: 'Binary WKB geometry bytes'},
    {label: 'Dimensions', value: 'Optional Z and M coordinates'},
    {label: 'APIs', value: 'encode and encodeSync'}
  ]}
/>

<ReferenceBoundary
  title="WKBWriter reference"
  description="The sections below document format metadata, installation, usage, dimensional options, and geometry details."
  tone="orange"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Writer for the [Well-known binary][wkb] format for representation of geometry.

[wkb]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.wkb`,                                       |
| File Type             | Binary                                        |
| File Format           | [Well Known Binary][wkb]                      |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `encode`, `encodeSync`                        |
| Encoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKBWriter} from '@loaders.gl/wkt';
import {encodeSync} from '@loaders.gl/core';

const geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [1, 2],
      [3, 4],
      [5, 6],
      [1, 2]
    ]
  ]
};
const arrayBuffer = encodeSync(geometry, WKBWriter, {wkt: {hasZ: false, hasM: false}});
```

## Options

- `hasZ`: Should be `true` if the GeoJSON input has Z values. These values are expected to be the third coordinate position.
- `hasM`: Should be `true` if the GeoJSON input has M values. Thes are expected to be the third coordinate position if Z values do not exist, or fourth if Z values do exist.

## Format Summary

Well-known binary (WKB) is a binary geometry encoding to store geometries (it
doesn't store attributes). It's used in databases such as PostGIS and as the
internal storage format of Shapefiles. It's also being discussed as the internal
storage format for a ["GeoArrow"](https://github.com/geopandas/geo-arrow-spec)
specification. WKB is defined starting on page 62 of the [OGC Simple Features
specification](http://portal.opengeospatial.org/files/?artifact_id=25355).

It's essentially a binary representation of WKT. For common geospatial types
including (Multi) `Point`, `Line`, and `Polygon`, there's a 1:1 correspondence
between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types,
such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to
GeoJSON.

- Coordinates can be 2-4 dimensions and are interleaved.
- Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
