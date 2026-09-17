---
title: GIS utilities
description: Convert between geographic feature, geometry, binary, and table representations.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {GeoArrowFlowGraphic} from '@site/src/components/docs/geoarrow-flow-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GIS support module"
  title="Keep geographic meaning attached to the data."
  description="The GIS module contains the small helpers that loaders and applications use to move between feature collections, binary geometry, tables, and shared CRS metadata."
  tone="orange"
  meta={['Geometry helpers', 'Feature tables', 'CRS-aware']}
  links={[
    {label: 'GIS category', to: '/docs/specifications/category-gis'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'}
  ]}
/>

<GeoArrowFlowGraphic />

<DocOrientation
  eyebrow="What belongs here"
  title="Small conversions with large downstream value."
  description="Format modules own parsing. GIS utilities make the resulting geometries and feature collections usable across renderers, analysis code, and table pipelines."
  tone="orange"
  items={[
    {label: 'Input', value: 'GeoJSON, binary features, and table columns'},
    {label: 'Output', value: 'Deck.gl-style binary or compatible features'},
    {label: 'Metadata', value: 'Geometry roles and coordinate references'},
    {label: 'Use it for', value: 'Rendering, reprojection boundaries, and adapters'}
  ]}
/>

This module contains helper classes for the GIS category of loaders.

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for shared
CRS types, the cross-format support matrix, and the reprojection roadmap.

<ReferenceBoundary
  title="GIS converters and utilities"
  description="The sections below list installation, converter documentation, and the utility functions exposed by this lightweight module."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/gis
```

## Converter Documentation

- [Converting data](/docs/developer-guide/converting-data)
- [Feature collection converters](/docs/developer-guide/converters/feature-collection-converters)
- [Render converters](/docs/developer-guide/converters/render-converters)
- [Format categories](/docs/developer-guide/converters/format-categories)

## Utility Functions

| Utility Function | Description |
| --- | --- |
| [`geojson-to-binary`](/docs/modules/gis/api-reference/geojson-to-binary) | Converts GeoJSON features into deck.gl-style binary feature collections |
| `getGeoArrowNativeGeometry(column, rowIndex, encoding, maximumDepth = 64)` | Reads one native GeoArrow row as geometry coordinates without materializing feature properties; supports concrete, dense-union, and GeometryCollection encodings |
| `getGeoArrowUnionGeometryKind(fieldName, typeId)` | Resolves a dense-union child's geometry family from its field name or canonical GeoArrow type ID |

`getGeoArrowNativeGeometry` returns a geometry or `null` for null, unsupported, or out-of-range
rows. WKB and WKT are handled by `GeometryConverter`, not this native-column reader. The native
reader remains re-exported by `@loaders.gl/geoarrow` for compatibility; loaders can use the GIS
export without depending on the richer GeoArrow processing module.
