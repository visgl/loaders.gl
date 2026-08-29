---
title: KMLLoader
description: Parse KML geographic documents into loaders.gl geometry tables.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="KML module · loader API"
  title="KMLLoader"
  description="Parse KML geographic documents into loaders.gl geometry tables, preserving the feature-oriented structure needed for maps and Earth-browser content."
  tone="mint"
  meta={['From v1.0', 'KML 2.2', 'OGC standard']}
  links={[
    {label: 'KML format', to: '/docs/modules/kml/formats/kml'},
    {label: 'KML module', to: '/docs/modules/kml'}
  ]}
/>

<KmlDocsTabs active="kmlloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Turn geographic documents into reusable data."
  description="KMLLoader maps KML features into the common geometry-table family, giving applications a predictable handoff from document parsing to rendering or analysis."
  tone="mint"
  items={[
    {label: 'Default', value: 'GeoJSONTable for application code'},
    {label: 'Rows', value: 'Object-row table for inspection'},
    {label: 'Columns', value: 'ArrowTable with WKB geometry'},
    {label: 'Document', value: 'Styles, folders, links, and views in KML'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<ReferenceBoundary
  title="KMLLoader reference"
  description="The sections below document imports, output shapes, options, and runtime limitations."
  tone="mint"
/>

The `KMLLoader` parses [KML files][kml_wikipedia] into loaders.gl geometry tables.

[kml_wikipedia]: https://en.wikipedia.org/wiki/Keyhole_Markup_Language

## Usage

```typescript
import {KMLLoader} from '@loaders.gl/kml';
import {load} from '@loaders.gl/core';

const data = await load(url, KMLLoader, options);
```

## Shapes

`KMLLoader` returns loaders.gl `GeoJSONTable` objects by default. Set `kml.shape` to select another table representation.

| Shape                | Output                                       |
| -------------------- | -------------------------------------------- |
| `geojson-table`      | loaders.gl GeoJSON table                     |
| `object-row-table`   | loaders.gl row table with GeoJSON features   |
| `arrow-table`        | loaders.gl `ArrowTable` with WKB geometry    |

## Options

| Option      | Type   | Default           | Description                            |
| ----------- | ------ | ----------------- | -------------------------------------- |
| `kml.shape` | string | `'geojson-table'` | Selects the returned table shape.      |

## Limitations

- In Node.JS, applications must import `@loaders.gl/polyfills` for the `DOMParser` polyfill.
