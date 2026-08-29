---
title: Converting data
description: Move between loaders.gl data shapes with explicit, composable converters.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Data conversion"
  title="Move between data shapes"
  description="Compose small, explicit converters when the next stage needs a different table, geometry, or rendering representation."
  tone="yellow"
  meta={['Explicit paths', 'Table and geometry shapes', 'Render-ready output']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

<DocOrientation
  eyebrow="The conversion path"
  title="Make the next shape an explicit decision."
  description="Converters connect related data representations without making every loader understand every other format. Applications choose the edges they need and keep the rest out of the bundle."
  tone="yellow"
  items={[
    {label: 'Detect', value: 'Identify the source and target data shapes'},
    {label: 'Compose', value: 'Pass the leaf converters that define an allowed path'},
    {label: 'Preserve', value: 'Keep metadata and binary columns where the target supports them'},
    {label: 'Render', value: 'Use dedicated geometry converters when GeoJSON is not required'}
  ]}
/>

The loaders.gl converter system is a graph of small, explicit converter objects. You pass the converters you want, `convert()` finds a path, and each leaf module handles one direct step.

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';
import {
  FeatureCollectionConverter,
  GeometryConverter
} from '@loaders.gl/gis';

const arrowTable = convert(table, 'arrow', [TableConverter, ArrowConverter]);
const wkb = convert(geometry, 'wkb', [GeometryConverter]);
const binary = convert(features, 'binary-feature-collection', [FeatureCollectionConverter]);
```

![Converter flow](/img/developer-guide/conversion-flow.svg)

<ReferenceBoundary
  title="Converter families and shape paths"
  description="The sections below document the dispatcher, table and Arrow conversions, GeoArrow and feature collections, render-focused utilities, and format categories."
  tone="yellow"
/>

## In This Section

| Topic | Use it for |
| --- | --- |
| [Converter dispatcher](/docs/developer-guide/converters/dispatcher) | How `convert()` detects shapes and chooses a path |
| [Table and Arrow converters](/docs/developer-guide/converters/table-and-arrow-converters) | Moving between loaders.gl table wrappers and Apache Arrow |
| [GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters) | Converting GeoArrow tables and rewriting GeoArrow geometry encodings |
| [Feature collection converters](/docs/developer-guide/converters/feature-collection-converters) | GeoJSON, Flat GeoJSON, binary feature collections, and geometry wire formats |
| [Render converters](/docs/developer-guide/converters/render-converters) | Direct geometry-column to `BinaryFeatureCollection` and Arrow-backed binary wrappers |
| [Format categories](/docs/developer-guide/converters/format-categories) | The shapes and format families these converters connect |

## Core Ideas

- Converters are opt-in. There is no global registry.
- Each leaf converter handles direct edges only.
- `convert()` can compose multiple direct steps when you pass enough converters.
- Geometry rendering does not have to route through GeoJSON.

## Current Converter Families

| Converter | Package | Direct responsibility |
| --- | --- | --- |
| `TableConverter` | `@loaders.gl/schema-utils` | loaders.gl table wrappers |
| `ArrowConverter` | `@loaders.gl/arrow` | Apache Arrow tables and table wrappers |
| `GeoArrowTableConverter` | `@loaders.gl/geoarrow` | GeoArrow tables and wrapper/table shapes |
| `GeoArrowGeometryConverter` | `@loaders.gl/geoarrow` | GeoArrow geometry encoding rewrites |
| `FeatureCollectionConverter` | `@loaders.gl/gis` | GeoJSON, Flat GeoJSON, binary feature collections |
| `GeometryConverter` | `@loaders.gl/gis` | single geometry values like WKB, WKT, TWKB, GeoJSON geometry |

## Render-Focused Conversions

Some conversions are not expressed as generic converter objects because they are rendering utilities rather than shape-dispatch nodes.

These include:

- `convertGeometryColumnToBinaryFeatureCollection()`
- `convertGeometryValuesToBinaryFeatureCollection()`
- `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection()`
- `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection()`

These utilities are documented in [Render converters](/docs/developer-guide/converters/render-converters).

## Why This Matters

The converter system gives you a few practical wins:

- small bundles through explicit imports
- predictable conversion paths
- reusable format-specific code in leaf modules
- a clean separation between table conversion, geometry conversion, and render conversion

The rest of this section goes converter by converter and shape by shape.
