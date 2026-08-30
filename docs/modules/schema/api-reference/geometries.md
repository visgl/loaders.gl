---
title: Geometries
description: Common geometry table representations for geospatial loaders.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Schema module · geometry data"
  title="Geometries"
  description="loaders.gl provides several geometry representations so geospatial data can move from format decoders to maps, analysis code, and binary rendering paths."
  tone="mint"
  meta={['GeoJSON tables', 'Binary geometry', 'GeoArrow-compatible']}
  links={[
    {label: 'Schema module', to: '/docs/modules/schema'},
    {label: 'GIS module', to: '/docs/modules/gis'},
    {label: 'GeoArrow', to: '/docs/modules/arrow/formats/geoarrow'}
  ]}
/>

<DocOrientation
  eyebrow="The geometry family"
  title="Use the geometry representation that matches the work."
  description="Readable GeoJSON is useful for application logic; binary and columnar forms reduce conversion overhead for rendering and analytical pipelines."
  tone="mint"
  items={[
    {label: 'GeoJSONTable', value: 'FeatureCollection with table metadata'},
    {label: 'Binary', value: 'Typed geometry arrays for rendering'},
    {label: 'WKB', value: 'Compact interoperable geometry bytes'},
    {label: 'Tessellation', value: 'Optional polygon preparation for drawing'}
  ]}
/>

<ReferenceBoundary
  title="Geometry reference"
  description="The sections below introduce the supported geometry table forms and tessellation considerations."
  tone="mint"
/>

## GeoJSONTable

The `GeoJSONTable` is one of the standard data return formats from loaders.gl loaders.
It is a GeoJSON FeatureCollection with two extra fields (`shape` and `schema`)

## Binary Geometries

loaders.gl defines a Binary Geometry Format.

The format is designed to work directly with the binary support in deck.gl layers.

This format is currently described in more detail in the `@loaders.gl/gis` module documentation.

##

## Tesselation

Some loaders can perform tesselation.

This is typically done with earcut, which is a very fast polygon tesselator. The drawback with

There can also be problems if polygons have very large numbers of holes.
