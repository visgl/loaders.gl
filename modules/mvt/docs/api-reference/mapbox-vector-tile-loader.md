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

```js
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

```js
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

const loaderOptions = {
  mvt: {
    coordinates: 'wgs84',
    tileIndex: {
      x: xTileIndex,
      y: yTileIndex,
      z: zTileIndex
    }
  }
};

const geoJSONfeatures = await load(url, MVTLoader, loaderOptions);
```

### GeoJSON with local coordinates

The parser will return an array of GeoJSON objects with local coordinates in a range from 0 to 1 and feature properties from MVT by default.

Even though tile coordinates go from 0 to 1, there can be some negative (or greater than one) coordinates because of buffer cells within MVT to handle geometry clipping. That difference can be as much as `bufferSize / tileExtent` depending on MVT creation parameters.

```js
import {MVTLoader} from '@loaders.gl/mvt';
import {load} from '@loaders.gl/core';

/*
* Default loader options are:
*
* {
*   mvt: {
*     coordinates: 'local'
*   }
* }
*/

const geoJSONfeatures = await load(url, MVTLoader);
```

## Options

| Option            | Type                                       | Default      | Description                                                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mvt.coordinates   | String                                     | `local`      | When set to `wgs84`, parser will return a flat array of GeoJSON representations of the features with coordinates decoded from provided tile index. When set to `local`, parser will return a flat array of GeoJSON objects with local coordinates decoded from tile origin. |
| mvt.layerProperty | String                                     | `layerName`  | The layer name is added to `feature.properties[layerProperty]` (first adds a `feature.property` object is created if it did not already exist). If set to `null`, it won't add layer name to any property.                                                                  |
| mvt.layers        | String[]                                   | _No default_ | Optional list of layer names. If supplied, only features belonging to the named layers will be included in the output. If not supplied, features from all layers are returned.                                                                                              |
| mvt.tileIndex     | Object ({x: number, y: number, z: number}) | _No default_ | Mandatory with `wgs84` coordinates option. An object containing tile index values (x, y, z) to decode WGS84 coordinates.                                                                                                                                                    |

If you want to know more about how geometries are encoded into MVT tiles, please read [this documentation section](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

## Attribution

The `MVTLoader` uses [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
