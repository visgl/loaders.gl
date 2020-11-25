# FlatGeobufLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

Loader for the [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

| Loader         | Characteristic                                                  |
| -------------- | --------------------------------------------------------------- |
| File Extension | `.fgb`,                                                         |
| File Type      | Binary                                                          |
| File Format    | [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/)       |
| Data Format    | [Geometry](/docs/specifications/category-gis)                   |
| Supported APIs | `load`, `loadInBatches`, `parse`, `parseSync`, `parseInBatches` |

## Usage

```js
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {load} from '@loaders.gl/core';

const geojsonFeatures = await load(url, FlatGeobufLoader);
```

## Outputs

### GeoJSON

The parser will return an array of [GeoJSON `features`](https://tools.ietf.org/html/rfc7946) in the coordinate system of the input data. If `gis.reproject` is enabled, coordinates will always be reprojected to WGS84.

## Options

| Option        | Type    | Default | Description                                                       |
| ------------- | ------- | ------- | ----------------------------------------------------------------- |
| gis.reproject | boolean | `false` | Whether to reproject input data into the WGS84 coordinate system. |

## Attribution

The `FlatGeobufLoader` wraps the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module under the ISC license.
