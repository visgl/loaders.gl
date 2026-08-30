---
title: WKTLoader
description: Parse readable OGC Well-Known Text geometry into loaders.gl data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WKT module · geometry loader"
  title="WKTLoader"
  description="Parse readable Well-Known Text geometry into the loaders.gl geometry representation used by mapping, analysis, and conversion pipelines."
  tone="orange"
  meta={['From v2.1', 'OGC WKT', 'Synchronous parser']}
  links={[
    {label: 'WKT format', to: '/docs/modules/wkt/formats/wkt'},
    {label: 'WKTWriter', to: '/docs/modules/wkt/api-reference/wkt-writer'},
    {label: 'WKT module', to: '/docs/modules/wkt'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Use text when the geometry should stay inspectable."
  description="WKT is easy to log, inspect, and exchange. WKTLoader handles the geometry syntax boundary and returns structured geometry without attaching feature attributes."
  tone="orange"
  items={[
    {label: 'Input', value: 'Readable WKT geometry text'},
    {label: 'Output', value: 'Structured geometry coordinates'},
    {label: 'Types', value: 'Points, lines, polygons, and extensions'},
    {label: 'APIs', value: 'load, parse, and parseSync'}
  ]}
/>

<ReferenceBoundary
  title="WKTLoader reference"
  description="The sections below document format metadata, installation, usage, options, and attribution."
  tone="orange"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Loader and writer for the [Well-known text][wkt] format for representation of geometry.

[wkt]: https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry

| Loader                | Characteristic                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| File Extension        | `.wkt`,                                                                                                      |
| File Type             | Text                                                                                                         |
| File Format           | [Well Known Text][wkt]                                                                                       |
| Data Format           | [Geometry](/docs/specifications/category-gis)                                                                |
| Supported APIs        | `load`, `parse`, `parseSync`                                                                                 |
| Decoder Type          | Synchronous                                                                                                  |
| Worker Thread Support | Yes [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)](http://shields.io) |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKTLoader} from '@loaders.gl/wkt';
import {parseSync} from '@loaders.gl/core';

const data = parseSync('LINESTRING (30 10, 10 30, 40 40)', WKTLoader);
// => {type: 'LineString', coordinates: [[30, 10], [10, 30], [40, 40]]}
```

```typescript
import {WKTLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKTLoader);
```

## Options

N/A

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
