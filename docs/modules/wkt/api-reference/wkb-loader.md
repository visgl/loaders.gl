---
title: WKBLoader
description: Parse compact OGC Well-Known Binary geometry into loaders.gl data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry loader"
  title="WKBLoader"
  description="Parse compact Well-Known Binary geometry into loaders.gl data for database, GIS, Shapefile, and GeoArrow-oriented pipelines."
  tone="orange"
  meta={['From v2.2', 'OGC WKB', 'Binary parser']}
  links={[
    {label: 'WKB format', to: '/docs/modules/wkt/formats/wkb'},
    {label: 'WKBWriter', to: '/docs/modules/wkt/api-reference/wkb-writer'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Keep geometry compact without losing its structure."
  description="WKB stores geometry as binary coordinates and topology without feature attributes. It is a useful boundary format for databases, shapefiles, and columnar geometry pipelines."
  tone="orange"
  items={[
    {label: 'Input', value: 'Binary WKB geometry bytes'},
    {label: 'Output', value: 'Structured positions and geometry'},
    {label: 'Dimensions', value: 'Two to four coordinate dimensions'},
    {label: 'APIs', value: 'load, parse, and parseSync'}
  ]}
/>

<ReferenceBoundary
  title="WKBLoader reference"
  description="The sections below document format metadata, installation, usage, geometry details, and attribution."
  tone="orange"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Loader for the [Well-known binary][wkb] format for representation of geometry.

[wkb]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.wkb`,                                       |
| File Type             | Binary                                        |
| File Format           | [Well Known Binary][wkb]                      |
| Data Format           | [Geometry](/docs/specifications/category-gis) |
| Supported APIs        | `load`, `parse`, `parseSync`                  |
| Decoder Type          | Synchronous                                   |
| Worker Thread Support | Yes                                           |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKBLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

// biome-ignore format: preserve intentional fixture layout
const buffer = new Uint8Array([
  1, 1, 0, 0,   0,  0,  0,
  0, 0, 0, 0, 240, 63,  0,
  0, 0, 0, 0,   0,  0, 64
]).buffer;
const data = parseSync(buffer, WKBLoader);
// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }
```

```typescript
import {WKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKBLoader);
```

## Options

N/A

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
