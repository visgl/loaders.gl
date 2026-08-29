---
title: triangulateWKBGeometryColumn
description: Tessellate GeoArrow WKB polygons into triangle indexes and XY vertex columns.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GeoArrow geometry utility"
  title="Turn WKB polygons into renderer-ready triangles."
  description="`triangulateWKBGeometryColumn` converts Polygon and MultiPolygon WKB values into Arrow columns for triangle indexes and source XY vertices, keeping one output row aligned with each input geometry."
  tone="cyan"
  meta={['GeoArrow WKB', 'Polygon triangulation', 'Arrow columns']}
  links={[
    {label: 'Arrow module', to: '/docs/modules/arrow'},
    {label: 'GIS module', to: '/docs/modules/gis'},
    {label: 'GeoArrow format', to: '/docs/modules/arrow/formats/geoarrow'}
  ]}
/>

<DocOrientation
  eyebrow="The geometry path"
  title="Decode geometry. Tessellate rings. Return aligned columns."
  description="The helper keeps the geometry column in Arrow form while making its polygon topology easy for renderers and GPU pipelines to consume."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Arrow Binary vector containing GeoArrow WKB'},
    {label: 'Geometry', value: 'Polygon and MultiPolygon values'},
    {label: 'Output', value: 'Triangle indexes plus XY vertices'},
    {label: 'Nulls', value: 'Null input rows remain null output rows'}
  ]}
/>

`triangulateWKBGeometryColumn` tessellates a GeoArrow WKB geometry column and returns two Apache
Arrow columns: triangle vertex indexes and the source XY vertices.

The helper accepts Polygon and MultiPolygon WKB values. Each output row matches the corresponding
input geometry row. Null input rows produce null output rows.

<ReferenceBoundary
  title="Geometry and output details"
  description="The reference below covers input vectors, output column types, row alignment, null behavior, and worker usage."
  tone="cyan"
/>

## Usage

```ts
import {triangulateWKBGeometryColumn} from '@loaders.gl/arrow';

const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);
```

## API

```ts
triangulateWKBGeometryColumn(geometryColumn);
```

`geometryColumn` is an Apache Arrow JS `Vector<Binary>` containing GeoArrow WKB geometry values.

Returns an object with:

| Field           | Type                                      | Description                                      |
| --------------- | ----------------------------------------- | ------------------------------------------------ |
| `vertexIndices` | `Vector<List<Int32>>`                     | Triangle indexes into the matching `vertices` row |
| `vertices`      | `Vector<List<FixedSizeList[2]<Float64>>>` | XY source vertices, preserving WKB vertex order  |

## Worker API

`triangulateWKBColumnOnWorker` runs the same operation on the triangulation worker. It accepts a
structured-cloneable Arrow `Data` payload and returns serialized Arrow data for the two output
columns.
