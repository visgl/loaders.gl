---
title: Feature collection converters
description: Convert feature collections and single geometries between object, flat, binary, and wire-format shapes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Converter guide · GIS shapes"
  title="Change the geometry representation at the boundary."
  description="Use the GIS converters when the same features need to move between standard GeoJSON, flattened coordinates, render-oriented binary bins, or compact WKB/WKT/TWKB values."
  tone="orange"
  meta={['GeoJSON and flat GeoJSON', 'Binary features', 'WKB / WKT / TWKB']}
  links={[
    {label: 'GIS module', to: '/docs/modules/gis'},
    {label: 'Render converters', to: '/docs/developer-guide/converters/render-converters'},
    {label: 'Format categories', to: '/docs/developer-guide/converters/format-categories'}
  ]}
/>

<DocOrientation
  eyebrow="Choose the shape for the next step"
  title="Keep features readable, compact, or render-ready."
  description="The converter id tells you which boundary you are crossing. Collection converters preserve feature-oriented meaning; geometry converters work on one geometry value; render converters prepare the typed arrays a layer consumes."
  tone="orange"
  items={[
    {label: 'FeatureCollectionConverter', value: 'GeoJSON, flat GeoJSON, and binary feature collections'},
    {label: 'GeometryConverter', value: 'Single geometry values and wire formats'},
    {label: 'Identity', value: 'Feature and row ids remain available after conversion'},
    {label: 'Use it when', value: 'The next consumer expects a different data shape'}
  ]}
/>

<ReferenceBoundary
  title="Converter ids and shape mappings"
  description="The reference below documents the registered converter contracts, multi-geometries, GeometryCollection handling, and representative usage."
  tone="orange"
 />

The GIS converter surface covers both whole feature collections and single geometry values.

## FeatureCollectionConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'feature-collection'` |
| `from` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| `to` | `'geojson'`, `'flat-geojson'`, `'binary-feature-collection'` |
| Typical use | Normalize geospatial features between object, flat, and render-oriented binary forms |

## GeometryConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/gis` |
| `id` | `'geometry'` |
| `from` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| `to` | `'geojson-geometry'`, `'wkb'`, `'wkt'`, `'twkb'` |
| Typical use | Convert single geometry values without building a feature collection |

## Shape Mapping

| Shape | Meaning |
| --- | --- |
| `geojson` | Standard GeoJSON features |
| `flat-geojson` | Flattened coordinate arrays with geometry metadata |
| `binary-feature-collection` | deck.gl-style renderable points/lines/polygons bins |
| `geojson-geometry` | A single geometry object, not a feature |
| `wkb`, `wkt`, `twkb` | Compact wire formats for single geometries |

## Multi-Geometries

Binary feature collections do not keep a separate top-level family for each multi-geometry type.

Instead:

- `MultiPoint` contributes vertices to the `points` bin
- `MultiLineString` contributes paths to the `lines` bin
- `MultiPolygon` contributes polygon objects and rings to the `polygons` bin

Feature identity is preserved through `featureIds` and `globalFeatureIds`.

## GeometryCollection

`FeatureCollectionConverter` itself is about collection-shape conversion, but render-oriented conversion now supports `GeometryCollection` through the direct geometry-column utilities documented in [Render converters](/docs/developer-guide/converters/render-converters).

For WKB/WKT render conversion:

- `GeometryCollection` is flattened recursively
- point members go to `points`
- line members go to `lines`
- polygon members go to `polygons`
- all members retain the original row index as their global feature id

## Example

```ts
import {convert} from '@loaders.gl/schema-utils';
import {FeatureCollectionConverter, GeometryConverter} from '@loaders.gl/gis';

const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);
const wkt = convert(binaryGeometry, 'wkt', [GeometryConverter]);
```
