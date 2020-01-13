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

const data = await load(url, MVTLoader);
```

## Options

N/A

## Attribution

The `MVTLoader` uses [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause.
