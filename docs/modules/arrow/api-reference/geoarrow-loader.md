---
title: GeoArrowLoader
description: Read Arrow tables and preserve GeoArrow geometry columns and metadata.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoArrow loader"
  title="Read geospatial tables without flattening geometry."
  description="GeoArrowLoader parses Arrow IPC data and recognizes GeoArrow extension metadata so geometry columns remain typed and discoverable alongside their attributes."
  tone="cyan"
  meta={['Arrow IPC', 'GeoArrow extensions', 'Feature tables']}
  links={[
    {label: 'GeoArrow format', to: '/docs/modules/arrow/formats/geoarrow'},
    {label: 'ArrowLoader', to: '/docs/modules/arrow/api-reference/arrow-loader'}
  ]}
/>

<ArrowDocsTabs active="geoarrowloader" />

<DocOrientation
  eyebrow="A geospatial Arrow entry point"
  title="Keep geometry metadata next to the columns."
  description="The loader uses the Arrow table as the transport and GeoArrow conventions to interpret geometry. Applications can continue with Arrow processing or convert the geometry columns for rendering."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Arrow IPC files and streams with GeoArrow metadata'},
    {label: 'Geometry', value: 'Recognized geometry extension columns'},
    {label: 'Attributes', value: 'Typed feature fields remain ordinary Arrow columns'},
    {label: 'Next step', value: 'GeoArrow conversion, scanning, or rendering'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From-v4.1" />
</p>

The `GeoArrowLoader` parses Apache Arrow columnar table format files, and looks for `GeoArrow` type extensions to parse geometries from the table.

<ReferenceBoundary
  title="GeoArrowLoader options and output"
  description="The sections below cover usage, options, recognized extension types, and the returned table shapes."
  tone="cyan"
/>

## Usage

```typescript
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
