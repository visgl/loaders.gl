---
title: GPXLoader
description: Parse GPX tracks, routes, and waypoints into loaders.gl geometry tables.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="KML module · loader API"
  title="GPXLoader"
  description="Parse GPX routes, tracks, and waypoints into loaders.gl geometry tables, with optional Arrow and binary representations for downstream processing."
  tone="mint"
  meta={['From v3.0', 'GPX', 'Geometry tables']}
  links={[
    {label: 'GPX format', to: '/docs/modules/kml/formats/gpx'},
    {label: 'KML module', to: '/docs/modules/kml'}
  ]}
/>

<KmlDocsTabs active="gpxloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Choose the table shape that fits the next stage."
  description="The default output is easy to use in mapping code. When a pipeline needs compact geometry or columnar interchange, GPXLoader can return binary or Arrow-backed forms instead."
  tone="mint"
  items={[
    {label: 'Default', value: 'GeoJSONTable for application code'},
    {label: 'Rows', value: 'Object-row table for inspection'},
    {label: 'Columns', value: 'ArrowTable with WKB geometry'},
    {label: 'Binary', value: 'Binary feature collection for rendering'}
  ]}
/>

<ReferenceBoundary
  title="GPXLoader reference"
  description="The sections below document imports, output shapes, options, and runtime limitations."
  tone="mint"
/>

The `GPXLoader` parses [GPX files][gpx_wikipedia] into loaders.gl geometry tables.

[gpx_wikipedia]: https://en.wikipedia.org/wiki/GPS_Exchange_Format

## Usage

```typescript
import {GPXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, GPXLoader, options);
```

## Shapes

`GPXLoader` returns loaders.gl `GeoJSONTable` objects by default. Set `gpx.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |
| `binary-geometry`    | loaders.gl binary feature collection         |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `gpx.shape` | string | `'geojson-table'` | Selects the returned table shape.      |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
