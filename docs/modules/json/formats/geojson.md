---
title: GeoJSON format
description: A readable JSON representation of geographic features and their properties.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {StructuredDataPathGraphic} from '@site/src/components/docs/structured-data-path-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="Readable feature format"
  title="GeoJSON"
  description="GeoJSON represents geographic features as JSON objects with explicit geometry and application properties. It is easy to inspect, exchange, and connect to web mapping code."
  tone="cyan"
  logos={[{alt: 'GeoJSON', src: '/images/format-logos/geojson-logo.svg'}]}
  meta={['RFC 7946', 'Feature collections', 'Human-readable']}
  links={[
    {label: 'JSON module', to: '/docs/modules/json'},
    {label: 'GeoJSON loader', to: '/docs/modules/json/api-reference/geojson-loader'}
  ]}
/>

<DocLiveExample label="GeoJSON format map example" height="420px">
  <ClientExample kind="geospatial" format="GeoJSON" />
</DocLiveExample>

<StructuredDataPathGraphic />

<DocOrientation
  eyebrow="The object model"
  title="Features first. Geometry stays explicit."
  description="A GeoJSON document can describe one geometry, one feature, or a collection of features. loaders.gl preserves that shape while making large inputs available through batches and table views."
  tone="cyan"
  items={[
    {label: 'Geometry', value: 'Point, line, polygon, and collections'},
    {label: 'Feature', value: 'Geometry plus an optional identifier and properties'},
    {label: 'Collection', value: 'A list of features under one document'},
    {label: 'Streaming', value: 'NDJSON for one feature per line'}
  ]}
/>

- [IETF standard](https://datatracker.ietf.org/doc/html/rfc7946)
- [geojson.org](https://geojson.org/)

GeoJSON is a format for encoding a variety of geographic data structures together with properties.

<ReferenceBoundary
  title="GeoJSON objects and alternatives"
  description="The sections below describe geometry shapes, feature collections, loader behavior, and related geographic formats."
  tone="cyan"
/>

## Geometries

Since GeoJSON geometries can be independently useful they are described on a [separate page](./geojson-geometry).

## Alternatives

| Format   | Support | Description                                   |
| -------- | ------- | --------------------------------------------- |
| TopoJSON | ❌      | A more compact version that encodes topology. |
