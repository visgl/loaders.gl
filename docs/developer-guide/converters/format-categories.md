---
title: Format categories
description: Understand the table, geometry, and feature shapes that connect loaders, converters, and renderers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Converter guide · data shapes"
  title="Name the shape before you choose the converter."
  description="loaders.gl uses explicit shape names to make data boundaries visible. This guide maps table, geometry, and feature-collection representations so an application can choose an output based on the next operation."
  tone="yellow"
  meta={['Table shapes', 'Geometry encodings', 'Render families']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Feature collection converters', to: '/docs/developer-guide/converters/feature-collection-converters'},
    {label: 'Table category', to: '/docs/specifications/category-table'}
  ]}
/>

<DocOrientation
  eyebrow="A practical map"
  title="Same data, different working shapes."
  description="Arrow and GeoArrow keep data columnar, GeoJSON keeps feature relationships explicit, and binary feature collections keep geometry ready for rendering. Converters connect those shapes without hiding the trade-off."
  tone="yellow"
  items={[
    {label: 'Tables', value: 'Typed columns, row objects, or column-oriented wrappers'},
    {label: 'Geometry', value: 'GeoJSON objects, WKB, WKT, TWKB, or GeoArrow encodings'},
    {label: 'Render output', value: 'Points, lines, and polygons with typed offsets and positions'},
    {label: 'Selection rule', value: 'Choose the shape that matches the next consumer'}
  ]}
/>

<ReferenceBoundary
  title="Shape names and mappings"
  description="The tables below define the public shape names and explain how multi-geometries and GeometryCollections map into render families."
  tone="yellow"
 />

The converters connect a few distinct format families. Keeping those families straight makes the API much easier to reason about.

## Table Shapes

| Shape | Family | Notes |
| --- | --- | --- |
| `arrow` | Apache Arrow | Raw Arrow `Table` |
| `arrow-table` | loaders.gl table wrapper | Arrow-backed wrapper shape |
| `object-row-table` | loaders.gl table wrapper | row objects |
| `array-row-table` | loaders.gl table wrapper | row arrays |
| `columnar-table` | loaders.gl table wrapper | column-oriented wrapper |
| `geojson-table` | loaders.gl table wrapper | rows with GeoJSON-style geometry/properties |
| `geoarrow` | GeoArrow table | Arrow table with GeoArrow geometry metadata |

## Geometry Formats

| Shape | Family | Notes |
| --- | --- | --- |
| `geojson-geometry` | GeoJSON | single geometry object |
| `wkb` | wire format | binary |
| `wkt` | wire format | text |
| `twkb` | wire format | compact binary |
| `geoarrow.wkb` | GeoArrow encoding | WKB stored in Arrow column |
| `geoarrow.wkt` | GeoArrow encoding | WKT stored in Arrow column |

## Native GeoArrow Encodings

| Shape | Meaning |
| --- | --- |
| `geoarrow.point` | native point column |
| `geoarrow.linestring` | native linestring column |
| `geoarrow.polygon` | native polygon column |
| `geoarrow.multipoint` | native multipoint column |
| `geoarrow.multilinestring` | native multilinestring column |
| `geoarrow.multipolygon` | native multipolygon column |
| `geoarrow.geometry` | dense union over geometry families |
| `geoarrow.geometrycollection` | GeometryCollection encoding |

## Feature Collection Shapes

| Shape | Family | Notes |
| --- | --- | --- |
| `geojson` | object model | standard feature collections |
| `flat-geojson` | flattened geometry model | still feature-oriented |
| `binary-feature-collection` | render model | points/lines/polygons bins |
| `arrow-binary-feature-collection` | Arrow-backed render model | Arrow wrapper over binary bins |

## How Multi-Geometries Map

| Geometry | Render family |
| --- | --- |
| `Point`, `MultiPoint` | `points` |
| `LineString`, `MultiLineString` | `lines` |
| `Polygon`, `MultiPolygon` | `polygons` |

This mapping is why binary feature collections are family-based rather than geometry-class-based.

## How GeometryCollection Maps

`GeometryCollection` does not get its own render bin.

Instead it is flattened into the existing families:

- point members -> `points`
- line members -> `lines`
- polygon members -> `polygons`

The source feature or row identity is preserved in the id arrays.
