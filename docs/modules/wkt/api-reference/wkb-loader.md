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
| Worker Thread Support | ✅ Yes                                           |

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Usage

```typescript
import {WKBLoader} from '@loaders.gl/wkt/bundled';
import {parseSync} from '@loaders.gl/core';

// biome-ignore format: preserve intentional fixture layout
const buffer = new Uint8Array([
  1, 1, 0, 0,   0,  0,  0,
  0, 0, 0, 0, 240, 63,  0,
  0, 0, 0, 0,   0,  0, 64
]).buffer;
const data = parseSync(buffer, WKBLoader);
// => {type: 'Point', coordinates: [1, 2]}
```

```typescript
import {WKBLoader} from '@loaders.gl/wkt';
import {load} from '@loaders.gl/core';

const data = await load(url, WKBLoader);
```

Asynchronous parsing uses the bundled worker automatically when workers are enabled. When
bundling with Vite, the worker URL can be supplied explicitly:

```typescript
import WKT_WORKER_URL from '@loaders.gl/wkt/wkt-worker.js?url';
import {parse} from '@loaders.gl/core';
import {WKBLoader} from '@loaders.gl/wkt';

const data = await parse(buffer, WKBLoader, {wkb: {workerUrl: WKT_WORKER_URL}});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `wkb.workerUrl` | `string` | CDN URL | Override the shared WKT/WKB worker URL. |

## Format Summary

WKB encodes geometry without a feature's attributes. It is used in spatial
databases and in the `geoarrow.wkb` geometry extension. Shapefile geometry records
use their own binary layout; they are not WKB records. See the
[WKB format page](../formats/wkb) for compatibility details.

It's essentially a binary representation of WKT. For common geospatial types
including (Multi) `Point`, `LineString`, and `Polygon`, there's a 1:1 correspondence
between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types,
such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to
GeoJSON.

- Coordinates can be 2-4 dimensions and are interleaved.
- Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
