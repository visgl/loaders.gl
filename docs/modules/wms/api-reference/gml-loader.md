---
title: GMLLoader
description: Parse the common geospatial feature subset of Geography Markup Language.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS module · geospatial loader"
  title="GMLLoader"
  description="Parse the practical feature and geometry subset of OGC Geography Markup Language into Arrow tables with GeoArrow geometry, including incremental feature batches for large responses."
  tone="cyan"
  meta={['From v3.3', 'GML', 'Streaming features']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'XMLLoader', to: '/docs/modules/xml/api-reference/xml-loader'},
    {label: 'GIS category', to: '/docs/specifications/category-gis'}
  ]}
/>

<DocOrientation
  eyebrow="What it reads"
  title="Extract useful features from an ambitious XML standard."
  description="GML covers a very broad space. GMLLoader focuses on the common feature-collection and geometry path, with a streaming mode that emits complete features as the response arrives."
  tone="cyan"
  items={[
    {label: 'Input', value: 'GML feature collections and responses'},
    {label: 'Geometry', value: 'Points, lines, polygons, and multiparts'},
    {label: 'Output', value: 'Arrow feature tables or explicit GeoJSON'},
    {label: 'Streaming', value: 'Feature batches for large WFS responses'}
  ]}
/>

<ReferenceBoundary
  title="GMLLoader reference"
  description="The sections below document usage, parsed data, streaming behavior, options, and the supported subset."
  tone="cyan"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `GMLLoader` parses the XML-formatted response from the
the [OGC](https://www.opengeospatial.org/)-standardized [GML](https://www.ogc.org/standards/wms) (Geographic Markup Language) file format into a standard geospatial feature table.

> Note that the GML standard is very ambitious and full support of the format is out of scope.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.gml`                                               |
| File Type             | Text                                                 |
| File Format           | [GML](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Arrow table with GeoArrow WKB geometry               |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | No                                                   |
| Streaming Support     | Feature collections                                  |

## Usage

```typescript
import {GMLLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a GML request
const url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;

const data = await load(url, GMLLoader, options);
```

## Parsed Data Format

The `GMLLoader` supports the standard geospatial subset of geometries (points, multipoints, lines,
linestrings, polygons and multipolygons). By default, it returns
`{shape: 'arrow-table', schema, data}`. Feature properties and IDs become columns and geometry uses
`geoarrow.wkb`. A bare geometry becomes a one-row table; an empty result becomes an empty table.
Coordinates are not reprojected, and CRS metadata is explicitly unknown (`crs: null`); this loader
does not yet resolve GML `srsName` into Arrow CRS metadata.

Set `gml.shape: 'geojson'` to retain the previous FeatureCollection, bare geometry, or null result.
Arrow conversion rejects properties that collide with the output `geometry` column or a feature
ID's `id` column; explicit GeoJSON retains both values.
The root `GMLLoader` is metadata-only (`_GMLLoader` remains an alias). Synchronous parsing uses
`GMLLoaderWithParser` from `@loaders.gl/wms/gml-loader`.

For large WFS responses, the parser-bearing loader also supports incremental feature batches:

```typescript
import {parseInBatches} from '@loaders.gl/core';
import {GMLLoader} from '@loaders.gl/wms';

for await (const batch of await parseInBatches(response.body, GMLLoader, {
  gml: {batchSize: 500}
})) {
  console.log(batch.data.numRows);
}
```

The streaming path emits complete `featureMember` / `featureMembers` features as they become
available and keeps incomplete fragments buffered. Each Arrow batch infers its own property
schema; heterogeneous batches can have different schemas. Bare geometries use whole-file parsing.
Explicit `gml.shape: 'geojson'` returns FeatureCollection batches. WFS source output remains
controlled by the WFS format option.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `gml.shape` | `'arrow-table' \| 'geojson'` | `'arrow-table'` | Whole-file and streaming output shape. |
| `gml.batchSize` | `number` | `1000` | Feature count per streaming batch. |
| `gml.propertyTypes` | `Record<string, GMLPropertyType>` | — | XML Schema scalar types keyed by local property name. |
| `gml.transformCoords` | `(...coordinates: number[]) => number[]` | Identity | Optional coordinate transformation. |
