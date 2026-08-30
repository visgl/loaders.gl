---
title: TCXLoader
description: Parse activity-oriented TCX files into loaders.gl geometry tables.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="KML module · loader API"
  title="TCXLoader"
  description="Parse Garmin Training Center XML activities into loaders.gl geometry tables while keeping the activity, lap, and measurement structure available to the application."
  tone="orange"
  meta={['From v3.0', 'TCX', 'Activity data']}
  links={[
    {label: 'TCX format', to: '/docs/modules/kml/formats/tcx'},
    {label: 'KML module', to: '/docs/modules/kml'}
  ]}
/>

<KmlDocsTabs active="tcxloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Keep track geometry compatible with table pipelines."
  description="TCXLoader presents activity tracks through the same geometry-table family used by related loaders, so applications can share rendering and analysis code."
  tone="orange"
  items={[
    {label: 'Default', value: 'GeoJSONTable for application code'},
    {label: 'Rows', value: 'Object-row table for inspection'},
    {label: 'Columns', value: 'ArrowTable with WKB geometry'},
    {label: 'Binary', value: 'Binary feature collection for rendering'}
  ]}
/>

<ReferenceBoundary
  title="TCXLoader reference"
  description="The sections below document imports, output shapes, options, and runtime limitations."
  tone="orange"
/>

The `TCXLoader` parses [TCX files][tcx_wikipedia] into loaders.gl geometry tables.

[tcx_wikipedia]: https://en.wikipedia.org/wiki/Training_Center_XML

## Usage

```typescript
import {TCXLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, TCXLoader, options);
```

## Shapes

`TCXLoader` returns loaders.gl `ArrowTable` objects by default. Set `tcx.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |
| `binary-geometry`    | loaders.gl binary feature collection         |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `tcx.shape` | string | `'arrow-table'` | Selects the returned table shape.      |

## Limitations

- The loader interprets coordinates as WGS84 longitude/latitude (`OGC:CRS84`).
