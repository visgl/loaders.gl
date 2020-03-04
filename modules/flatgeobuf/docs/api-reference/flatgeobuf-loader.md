# FlatGeobufLoader

Loader for the [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/) format for representation of geometry.

| Loader         | Characteristic                                            |
| -------------- | --------------------------------------------------------- |
| File Extension | `fgb`,                                                    |
| File Type      | Binary                                                    |
| File Format    | [FlatGeobuf](https://bjornharrtell.github.io/flatgeobuf/) |
| Data Format    | [Geometry](/docs/specifications/category-gis)             |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`            |

## Usage

```js
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {load} from '@loaders.gl/core';

const features = await load(url, FlatGeobufLoader);
```

## Outputs

### GeoJSON

The parser will return an array of [GeoJSON objects](https://tools.ietf.org/html/rfc7946) with WGS84 coordinates and feature properties.

```js
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {load} from '@loaders.gl/core';

const geoJSONfeatures = await load(url, FlatGeobufLoader, loaderOptions);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| N/A    |      |         |             |
