---
title: MVTWriter
description: Encode geometry as Mapbox Vector Tile protobuf data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MVT module · writer API"
  title="MVTWriter"
  description="Encode GeoJSON-style geometry as a compact Mapbox Vector Tile, with control over layer naming, tile extent, version, and coordinate projection."
  tone="blue"
  meta={['Experimental', 'MVT 1 / 2', 'Protobuf output']}
  links={[
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'},
    {label: 'MVTLoader', to: '/docs/modules/mvt/api-reference/mvt-loader'},
    {label: 'MVT module', to: '/docs/modules/mvt'}
  ]}
/>

<DocOrientation
  eyebrow="What it writes"
  title="Package geometry for tile delivery."
  description="MVTWriter turns feature geometry and properties into the protobuf tile payload expected by vector-tile clients and tile sources."
  tone="blue"
  items={[
    {label: 'Input', value: 'GeoJSON-style geometry data'},
    {label: 'Output', value: 'Binary Mapbox Vector Tile'},
    {label: 'Layer', value: 'A named layer in the tile'},
    {label: 'Projection', value: 'Optional WGS84 to tile-space conversion'}
  ]}
/>

<ReferenceBoundary
  title="MVTWriter reference"
  description="The sections below document format metadata, installation, usage, and encoding options."
  tone="blue"
/>

Writer for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.mvt`,                                                                   |
| File Type      | Binary                                                                    |
| File Format    | [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                             |
| Supported APIs | `encode`, `encodeSync`                                                    |

## Installation

```bash
npm install @loaders.gl/mvt
npm install @loaders.gl/core
```

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import {MVTWriter} from '@loaders.gl/mvt';

const arrayBuffer = await encode(geojson, MVTWriter, {
  mvt: {
    layerName: 'my-layer',
    version: 2,
    extent: 4096
  }
});
```

## Options

| Option        | Type                                | Default          | Description                                                          |
| ------------- | ----------------------------------- | ---------------- | -------------------------------------------------------------------- |
| mvt.layerName | `string`                            | `'geojsonLayer'` | Name of the single layer that will be written into the tile          |
| mvt.version   | `number`                            | `1`              | Vector tile specification version                                    |
| mvt.extent    | `number`                            | `4096`           | Extent of the vector tile grid                                       |
| mvt.tileIndex | `{x: number, y: number, z: number}` | `undefined`      | Optional tile index for projecting WGS84 coordinates into tile space |
