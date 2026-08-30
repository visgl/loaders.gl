---
title: GeoJSON Geometry
description: Understand the geometry object shared by GeoJSON features and vector data pipelines.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoJSON geometry"
  title="GeoJSON Geometry"
  description="GeoJSON geometry objects describe coordinates and their type without carrying feature properties. They are useful on their own when a pipeline needs geometry before it assembles complete features."
  tone="mint"
  meta={['Point and line', 'Polygon and multiparts', 'JSON interchange']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'GeoJSON loader', to: '/docs/modules/json/api-reference/geojson-loader'},
    {label: 'GIS category', to: '/docs/specifications/category-gis'}
  ]}
/>

<DocOrientation
  eyebrow="The geometry boundary"
  title="Choose the type. Supply coordinates. Let the feature layer add context."
  description="Geometry is the spatial part of a GeoJSON feature. Keeping it separate is useful for geometry-only APIs, validation, conversion, and renderer-facing data paths."
  tone="mint"
  items={[
    {label: 'Type', value: 'Point, LineString, Polygon, or Multi* geometry'},
    {label: 'Coordinates', value: 'Nested arrays matching the geometry type'},
    {label: 'Context', value: 'Properties and IDs belong to the feature layer'},
    {label: 'Alternatives', value: 'WKB for compact binary, WKT for text geometry'}
  ]}
/>

GeoJSON geometries can sometimes be useful independently of GeoJSON.

<ReferenceBoundary
  title="Geometry structure details"
  description="The reference below covers coordinate nesting, geometry examples, and the tradeoffs against WKB, WKT, and GML geometry."
  tone="mint"
/>

## Examples

```json
  {
    "type": "Point",
    "coordinates": [102.0, 0.5]
  },
```

```json
  {
    "type": "LineString",
    "coordinates": [
      [102.0, 0.0],
      [103.0, 1.0],
      [104.0, 0.0],
      [105.0, 1.0]
    ]
  },
```

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [100.0, 0.0],
      [101.0, 0.0],
      [101.0, 1.0],
      [100.0, 1.0],
      [100.0, 0.0]
    ]
  ]
}
```

## Alternatives

| Format       | Notes                                                               |
| ------------ | ------------------------------------------------------------------- |
| WKB          | Binary, more compact                                                |
| WKT          | Text based, slightly more compact, a bit harder to parse (not JSON) |
| GML Geometry | XML based, even more verbose, more complex to parse                 |
