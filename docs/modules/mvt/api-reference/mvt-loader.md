# MVTLoader

Loader for the [Mapbox Vector Tile](https://docs.mapbox.com/vector-tiles/specification/) format for representation of geometry.

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

// GeoJSON objects containing local coordinates decoded from tile origin to a range of [0 - (bufferSize / tileExtent), 1 + (bufferSize / tileExtent)]
const geometryData = await load(url, MVTLoader);

// Array containing GeoJSON Features
const loaderOptions = {
  mvt: {
    coordinates: 'wgs84',
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

The parser will return an array of [GeoJSON objects](https://tools.ietf.org/html/rfc7946) with WGS84 coordinates and feature properties from MVT if `coordinates` property is set to `wgs84` and `tileIndex` properties are present.

```typescript
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MVTLoader,  {
  mvt: {
    coordinates: 'wgs84',
    tileIndex: {
      x: xTileIndex,
      y: yTileIndex,
      z: zTileIndex
    }
  }
});
```

### GeoJSON with local coordinates

The parser will return an array of GeoJSON objects with local coordinates in a range from 0 to 1 and feature properties from MVT by default.

Even though tile coordinates go from 0 to 1, there can be some negative (or greater than one) coordinates because of buffer cells within MVT to handle geometry clipping. That difference can be as much as `bufferSize / tileExtent` depending on MVT creation parameters.

Note that local coordinates are relative to tile origin, which is in the top left.

```typescript
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, MVTLoader);

/*
 * Default loader options are:
 *
 * {
 *   mvt: {
 *     coordinates: 'local'
 *   }
 * }
 */

```

## Options

| Option            | Type                                | Default       | Description                                                                                                                                                 |
| ----------------- | ----------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mvt.shape         | `'geojson'                          | `binary`      | `geojson`: returns GeoJSON objects. `binary`: returns binary                                                                                          data. |
| mvt.coordinates   | `'local'                            | `local`       | `wgs84`: returns coordinates in longitude, latitude using the provided tile index. `local` returns local `0-1` coordinates relative to the tile origin.     |
| mvt.tileIndex     | `{x: number, y: number, z: number}` | N/A           | When the `wgs84` coordinates option, the index of the tile being loaded (`x`, `y`, `z`) must be supplied.                                                   |
| mvt.layerProperty | `string \| null`                    | `'layerName'` | When non-`null`, the layer name of each feature is added to `feature.properties[layerProperty]`. If `null`, a layer name property will not be added.        |
| mvt.layers        | `string[]`                          | N/A           | If provided, only features belonging to the named layers will be included, otherwise features from all layers are returned.                                 |

If you want to know more about how geometries are encoded into MVT tiles, please read [this documentation section](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

## Attribution

The `MVTLoader` is a fork of [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
