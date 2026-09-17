---
title: MVTLoader
description: Decode a Mapbox Vector Tile into geometry or a table-shaped result.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {LoaderLiveExample} from '@site/src/components/docs/loader-live-example';

<DocPageHeader
  eyebrow="MVT loader"
  title="Turn one vector tile into usable features."
  description="MVTLoader decodes protobuf tile layers into Arrow tables by default, with explicit GeoJSON and binary shapes for mapping workflows."
  tone="blue"
  meta={['Binary input', 'Arrow output', 'GeoJSON opt-in']}
  links={[
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'},
    {label: 'MVT module', to: '/docs/modules/mvt'}
  ]}
/>

<LoaderLiveExample />

<DocOrientation
  eyebrow="What the loader does"
  title="Decode the payload. Choose the coordinate space."
  description="The tile address is supplied by the application or source. The loader focuses on decoding layers, geometry commands, properties, and the requested output representation."
  tone="blue"
  items={[
    {label: 'Input', value: 'A protobuf-encoded MVT payload'},
    {label: 'Geometry', value: 'Tile-local or WGS84 coordinates'},
    {label: 'Properties', value: 'Feature attributes from each layer'},
    {label: 'Output', value: 'Arrow table by default, or explicit GeoJSON/binary shapes'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

Loader for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

<ReferenceBoundary
  title="Loader options and output shapes"
  description="The detailed reference below covers recognition, usage, coordinate conversion, and the output structures returned by MVTLoader."
  tone="blue"
/>

| Loader         | Characteristic                                                            |
| -------------- | ------------------------------------------------------------------------- |
| File Extension | `.mvt`,                                                                   |
| File Type      | Binary                                                                    |
| File Format    | [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)                             |
| Supported APIs | `load`, `parse`, `parseSync`                                              |

## Usage

```typescript
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

// Arrow table containing local coordinates decoded from tile origin.
const geometryData = await load(url, MVTLoader);

// Array containing GeoJSON Features
const loaderOptions = {
  mvt: {
    coordinates: 'wgs84',
    shape: 'geojson-table',
    tileIndex: {
      x: 0,
      y: 0,
      z: 0
    }
  }
};

const geoJSONfeatures = await load(url, MVTLoader, loaderOptions);
```

## Outputs

### GeoJSON

Set `mvt.shape` to `'geojson-table'` to return an array of [GeoJSON objects](https://tools.ietf.org/html/rfc7946) with WGS84 coordinates and feature properties from MVT. `coordinates: 'wgs84'` requires a matching `tileIndex`.

```typescript
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MVTLoader, {
  mvt: {
    coordinates: 'wgs84',
    shape: 'geojson-table',
    tileIndex: {
      x: xTileIndex,
      y: yTileIndex,
      z: zTileIndex
    }
  }
});
```

### GeoJSON with local coordinates

The parser returns an Arrow table with local coordinates by default. Set `mvt.shape` to `'geojson-table'` for an array of GeoJSON objects.

Even though tile coordinates go from 0 to 1, there can be some negative (or greater than one) coordinates because of buffer cells within MVT to handle geometry clipping. That difference can be as much as `bufferSize / tileExtent` depending on MVT creation parameters.

Note that local coordinates are relative to tile origin, which is in the top left.

```typescript
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MVTLoader, {mvt: {shape: 'geojson-table'}});

/*
 * Default loader options are:
 *
 * {
 *   mvt: {
 *     coordinates: 'local',
 *     shape: 'arrow-table'
 *   }
 * }
 */
```

## Options

| Option            | Type                                                | Default           | Description                                                                                                                                             |
| ----------------- | --------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mvt.shape         | `'geojson-table' \| 'columnar-table' \| 'binary-geometry' \| 'arrow-table'` | `arrow-table`   | Returned tile shape. Use `geojson-table` for feature objects or `binary-geometry` for binary geometry output.                                                                                  |
| mvt.coordinates   | `'local' \| 'wgs84'`                                | `local`           | `wgs84`: returns coordinates in longitude, latitude using the provided tile index. `local` returns local `0-1` coordinates relative to the tile origin. |
| mvt.tileIndex     | `{x: number, y: number, z: number}`                 | N/A               | When the `wgs84` coordinates option, the index of the tile being loaded (`x`, `y`, `z`) must be supplied.                                               |
| mvt.layerProperty | `string \| null`                                    | `'layerName'`     | When non-`null`, the layer name of each feature is added to `feature.properties[layerProperty]`. If `null`, a layer name property will not be added.    |
| mvt.layers        | `string[]`                                          | N/A               | If provided, only features belonging to the named layers will be included, otherwise features from all layers are returned.                             |

If you want to know more about how geometries are encoded into MVT tiles, please read [this documentation section](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

## Attribution

The `MVTLoader` is a fork of [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
