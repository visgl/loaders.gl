---
title: HexWKBLoader
description: Parse hexadecimal WKB strings into structured geometry data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry loader"
  title="HexWKBLoader"
  description="Decode WKB represented as hexadecimal text when a database, API, or JSON envelope cannot carry raw binary bytes directly."
  tone="violet"
  meta={['From v2.2', 'Hexadecimal WKB', 'Synchronous parser']}
  links={[
    {label: 'WKB format', to: '/docs/modules/wkt/formats/wkb'},
    {label: 'WKBLoader', to: '/docs/modules/wkt/api-reference/wkb-loader'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Cross the text-to-binary boundary once."
  description="HexWKBLoader accepts hexadecimal WKB and returns the same structured geometry shape as the binary WKB loader, so downstream GIS code does not need to care how the bytes arrived."
  tone="violet"
  items={[
    {label: 'Input', value: 'Hexadecimal text containing WKB bytes'},
    {label: 'Output', value: 'Structured geometry positions'},
    {label: 'Dimensions', value: 'Two to four coordinate dimensions'},
    {label: 'APIs', value: 'load, parse, and parseSync'}
  ]}
/>

<ReferenceBoundary
  title="HexWKBLoader reference"
  description="The sections below document installation, usage, WKB geometry details, and the relationship between hexadecimal and binary inputs."
  tone="violet"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Loader for hex encoded [Well-known binary][wkb] format for representation of geometry.

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
import {HexWKBLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

// biome-ignore format: preserve intentional fixture layout
const data = parseSync(data, HexWKBLoader);
// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }
```

```typescript
import {HexWKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, HexWKBLoader);
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
