# FlatGeobufLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Loader for the [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

| Loader         | Characteristic                                            |
| -------------- | --------------------------------------------------------- |
| File Extension | `.fgb`,                                                   |
| File Type      | Binary                                                    |
| File Format    | [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)             |
| Supported APIs | `load`, `parse`, `parseSync`                              |

## Usage

```js
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
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

## Options

| Option          | Type   | Default | Description                                                                                                                                                                                                                                                                            |
| --------------- | ------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| mvt.coordinates | String | `local` | When set to `wgs84`, the parser will return a flat array of GeoJSON objects with coordinates in longitude, latitude decoded from the provided tile index. When set to `local`, the parser will return a flat array of GeoJSON objects with local coordinates decoded from tile origin. |

If you want to know more about how geometries are encoded into MVT tiles, please read [this documentation section](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

## Attribution

The `MVTLoader` uses [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
