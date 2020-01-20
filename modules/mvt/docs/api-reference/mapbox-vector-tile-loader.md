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

// Point objects with geometry decoded from (0, 0)
const geometryData = await load(url, MVTLoader);

// GeoJSON Features
const loaderOptions = {
  mvt: {
    geojson: true,
    tileIndex: {
      x: 0,
      y: 0,
      z: 0
    }
  }
};

const geoJSONfeatures = await load(url, MVTLoader, loaderOptions);
```

## Options

| Option          | Type                                             | Default      | Description                                                                                                                                                                                                                                                                                     |
| --------------- | ------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mvt.geojson`   | Boolean                                          | true         | If `true`, parser will return a flat array of GeoJSON representations of the features with coordinates decoded from provided tile index. If `false`, parser will return a flat array of [Point](https://github.com/mapbox/point-geometry) objects with feature coordinates decoded from (0, 0). |
| `mvt.tileIndex` | Object ({x: `number`, y: `number`, z: `number`}) | _No default_ | Mandatory if using `geojson` output (It will return null coordinates if omitted). An object containing tile index values (x, y, z) to decode coordinates.                                                                                                                                       |

If you want to know more about how geometries are encoded into MVT tiles, please read [this documentation section](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).

## Attribution

The `MVTLoader` uses [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
