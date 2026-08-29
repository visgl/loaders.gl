---
title: MLTLoader
description: Parse MapLibre Tile payloads into reusable vector-tile data shapes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="MLT API · vector tiles"
  title="Decode a compact tile into application data."
  description="MLTLoader parses a MapLibre Tile payload and exposes its feature tables as GeoJSON or binary geometry data. Use it directly when tile addressing and repeated requests are handled elsewhere."
  tone="cyan"
  meta={['From v4.4', 'Binary vector tile', 'GeoJSON or binary geometry']}
  links={[
    {label: 'MLT module', to: '/docs/modules/mlt'},
    {label: 'MLT format', to: '/docs/modules/mlt/formats/mlt'},
    {label: 'MLT source', to: '/docs/modules/mlt/api-reference/mlt-source-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The MLT loader path"
  title="Decode bytes first. Choose coordinates at the edge."
  description="MLTLoader keeps binary tile decoding separate from tile addressing. The same payload can stay in local tile space for rendering or be converted to WGS84 when the tile index is available."
  tone="cyan"
  items={[
    {label: 'Input', value: 'One MapLibre Tile binary payload'},
    {label: 'Tables', value: 'Named feature tables with geometry and attributes'},
    {label: 'Output', value: 'GeoJSON table or binary geometry data'},
    {label: 'Coordinates', value: 'Local tile space by default; WGS84 is optional'}
  ]}
/>

<ReferenceBoundary
  title="MLTLoader reference"
  description="The sections below document installation, output shapes, coordinate options, tile indexes, and parser behavior."
  tone="cyan"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square" alt="From-v4.4" />
</p>

Loader for the [MapLibre Tile (MLT)](/docs/modules/mlt/formats/mlt) geospatial tile format.

| Loader         | Characteristic                                 |
| -------------- | ---------------------------------------------- |
| File Extension | `.mlt`                                         |
| File Type      | Binary                                         |
| File Format    | [MapLibre Tile](/docs/modules/mlt/formats/mlt) |
| MIME Types     | `application/vnd.maplibre-tile`                |
| Data Format    | [Geometry](/docs/specifications/category-gis)  |
| Supported APIs | `load`, `parse`, `parseSync`                   |
| Worker Thread  | Not available for this loader                  |

## Installation

```bash
npm install @loaders.gl/mlt
npm install @loaders.gl/core
```

## Usage

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {load} from '@loaders.gl/core';

const tileFeatures = await load(url, MLTLoader);
```

### Geometry in local tile space

By default, `MLTLoader` returns GeoJSON features using local tile coordinates in `[0, 1]` space:

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MLTLoader);
```

### Geometry in WGS84

Set `coordinates: 'wgs84'` and provide the tile index to get longitude / latitude coordinates:

```typescript
import {MLTLoader} from '@loaders.gl/mlt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MLTLoader, {
  mlt: {
    coordinates: 'wgs84',
    tileIndex: {
      x: tileX,
      y: tileY,
      z: tileZ
    }
  }
});
```

### Output shapes

| `shape` option        | Output                    |
| --------------------- | ------------------------- |
| `'geojson-table'` (default) | `GeoJSONTable`            |
| `'binary-geometry'`         | binary feature collection |

## Options

| Option              | Type                                       | Default     | Description                                                    |
| ------------------- | ------------------------------------------ | ----------- | -------------------------------------------------------------- |
| `mlt.shape`         | `'geojson-table' \| 'binary-geometry'` | `geojson-table` | Output shape: GeoJSON table or binary geometry |
| `mlt.coordinates`   | `'local' \| 'wgs84'`                       | `local`     | Coordinate system for returned geometries                      |
| `mlt.tileIndex`     | `{x: number, y: number, z: number}`        | N/A         | Required when `coordinates` is `wgs84`                         |
| `mlt.layerProperty` | `string`                                   | `layerName` | Name of layer property added to feature properties             |
| `mlt.layers`        | `string[]`                                 | N/A         | Restrict parsing to specific tile layers                       |

`mlt.tileIndex` is required for WGS84 output.

## Additional examples

- [Loaders.gl MLT website example](/examples/tiles/mlt).
- [MLTSourceLoader](/docs/modules/mlt/api-reference/mlt-source-loader) for URL tile sets.

## Attribution

`MLTLoader` implements loaders.gl integration, GeoJSON table and binary geometry shaping, and coordinate projection around the [@maplibre/mlt](https://github.com/maplibre/mlt) decoder and the [MapLibre Tile specification](https://github.com/maplibre/maplibre-tile-spec).
