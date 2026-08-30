---
title: TWKBLoader
description: Parse compact Tiny Well-Known Binary geometry into loaders.gl data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry loader"
  title="TWKBLoader"
  description="Parse Tiny Well-Known Binary geometry and expose it through the same application-facing geometry shape used by the WKT module."
  tone="orange"
  meta={['From v4.0', 'Compact binary', 'Synchronous parser']}
  links={[
    {label: 'TWKB format', to: '/docs/modules/wkt/formats/twkb'},
    {label: 'TWKBWriter', to: '/docs/modules/wkt/api-reference/twkb-writer'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Reconstruct geometry from compact integer records."
  description="TWKB reduces transport size by quantizing coordinates and storing neighboring positions as deltas. The loader handles that binary representation before returning structured geometry data."
  tone="orange"
  items={[
    {label: 'Input', value: 'Tiny Well-Known Binary bytes'},
    {label: 'Encoding', value: 'Quantized coordinates, deltas, and varints'},
    {label: 'Output', value: 'Structured geometry positions'},
    {label: 'APIs', value: 'load, parse, and parseSync'}
  ]}
/>

<ReferenceBoundary
  title="TWKBLoader reference"
  description="The sections below document installation, usage, the compact geometry encoding, and the current loader behavior."
  tone="orange"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Loader for the [Well-known binary][wkb] format for representation of geometry.

[wkb]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.wkb`,                                       |
| File Type             | Binary                                        |
| File Format           | [Tiny Well Known Binary][twkb]                |
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
import {TWKBLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

// biome-ignore format: preserve intentional fixture layout
const buffer = new Uint8Array([
  1, 1, 0, 0,   0,  0,  0,
  0, 0, 0, 0, 240, 63,  0,
  0, 0, 0, 0,   0,  0, 64
]).buffer;
const data = parseSync(buffer, TWKBLoader);
// => { positions: { value: Float64Array(2) [ 1, 2 ], size: 2 } }
```

```typescript
import {TWKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, TWKBLoader);
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
