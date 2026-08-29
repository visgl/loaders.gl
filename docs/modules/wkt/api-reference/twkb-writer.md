---
title: TWKBWriter
description: Encode loaders.gl geometry as compact Tiny Well-Known Binary.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry writer"
  title="TWKBWriter"
  description="Encode structured geometry as Tiny Well-Known Binary when a compact binary representation is more useful than readable WKT or general-purpose WKB."
  tone="orange"
  meta={['From v4.0', 'Compact binary', 'Synchronous writer']}
  links={[
    {label: 'TWKB format', to: '/docs/modules/wkt/formats/twkb'},
    {label: 'TWKBLoader', to: '/docs/modules/wkt/api-reference/twkb-loader'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Turn structured geometry into transport-sized bytes."
  description="The writer accepts GeoJSON-style geometry, applies the selected dimensional flags, and emits TWKB bytes that can be stored or sent to a service implementing the TWKB specification."
  tone="orange"
  items={[
    {label: 'Input', value: 'GeoJSON-style point, line, polygon, or collection'},
    {label: 'Dimensions', value: 'XY, XYZ, XYM, or XYZM through writer options'},
    {label: 'Output', value: 'ArrayBuffer containing TWKB'},
    {label: 'APIs', value: 'encode and encodeSync'}
  ]}
/>

<ReferenceBoundary
  title="TWKBWriter reference"
  description="The sections below document installation, usage, dimensional options, and the compact format summary."
  tone="orange"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Writer for the [Tiny Well-known binary][twkb] format for representation of geometry.

[twkb]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary

| Loader                | Characteristic                                |
| --------------------- | --------------------------------------------- |
| File Extension        | `.wkb`,                                       |
| File Type             | Binary                                        |
| File Format           | [Tiny Well Known Binary][twkb]                |
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
import {TWKBWriter} from '@loaders.gl/wkt';
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
const arrayBuffer = encodeSync(geometry, TWKBWriter, {wkt: {hasZ: false, hasM: false}});
```

## Options

- `hasZ`: Should be `true` if the GeoJSON input has Z values. These values are expected to be the third coordinate position.
- `hasM`: Should be `true` if the GeoJSON input has M values. Thes are expected to be the third coordinate position if Z values do not exist, or fourth if Z values do exist.

## Format Summary

Well-known binary (TWKB) is a binary geometry encoding to store geometries (it
doesn't store attributes). It's used in databases such as PostGIS and as the
internal storage format of Shapefiles. It's also being discussed as the internal
storage format for a ["GeoArrow"](https://github.com/geopandas/geo-arrow-spec)
specification. TWKB is defined starting on page 62 of the [OGC Simple Features
specification](http://portal.opengeospatial.org/files/?artifact_id=25355).

- Coordinates can be 2-4 dimensions and are interleaved.
- Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
