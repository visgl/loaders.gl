---
title: DBFLoader
description: Decode the attribute table component of a Shapefile dataset.
hide_title: true
page_style: designed
---

import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Shapefile module · attribute loader"
  title="DBFLoader"
  description="Decode the legacy dBase attribute table that accompanies Shapefile geometry, with control over the text encoding used for field values."
  tone="orange"
  meta={['From v2.3', 'DBF attributes', 'Encoding-aware']}
  links={[
    {label: 'Shapefile format', to: '/docs/modules/shapefile/formats/shapefile'},
    {label: 'ShapefileLoader', to: '/docs/modules/shapefile/api-reference/shapefile-loader'},
    {label: 'Shapefile module', to: '/docs/modules/shapefile'}
  ]}
/>

<ShapefileDocsTabs active="dbf" />

<DocOrientation
  eyebrow="What it reads"
  title="Keep the attribute table separate when you need it."
  description="DBFLoader handles the fields stored alongside Shapefile geometry. Applications can use it directly for attribute inspection or let ShapefileLoader join it with the geometry component."
  tone="orange"
  items={[
    {label: 'Input', value: 'A `.dbf` dBase attribute file'},
    {label: 'Output', value: 'Rows of decoded field values'},
    {label: 'Encoding', value: 'CPG-guided or explicitly selected'},
    {label: 'Boundary', value: 'Attributes only, without geometry'}
  ]}
/>

<ReferenceBoundary
  title="DBFLoader reference"
  description="The sections below document installation, usage, encoding options, and the relationship to the full Shapefile dataset."
  tone="orange"
/>

A sub loader for the `.dbf` (attributes/properties) file component of a shapefile. This is essentially a loader for the legacy dBase 7 database format.

Note: Most applications will want to use the `ShapefileLoader` instead of this loader.

## Usage

The `DBFLoader` parses feature attributes from the Shapefile format.

```typescript
import {DBFLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const options = {
  dbf: {
    encoding: 'utf8'
  }
};
const data = await load(url, DBFLoader, options);
// [{foo: null}, {foo: 'blue'}, {foo: 'green'}];
```

## Options

- `encoding`: text encoding of DBF file: usually either `utf8`, or `ascii`/`windows-1252`. For Shapefiles, there's often a `.cpg` file designating the encoding used.

## Format Summary

ESRI Shapefiles are a popular file format for storing geospatial vector data.
The format consists of a number of files that must be stored together and with
the same file name. Files with extensions `.shp`, `.shx`, `.dbf` must exist;
additional files with other extensions such as `.prj` and `.cpg` may exist.
