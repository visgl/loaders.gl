# FlatGeobufLoader

![flatgeobuf-logo](../images/flatgeobuf-logo.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square" alt="From-v3.1" />
  <img src="https://img.shields.io/badge/arrow_output-From_v5.0-blue.svg?style=flat-square" alt="arrow output from v5.0" />
  &nbsp;
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

Loader for the [FlatGeobuf](/docs/modules/flatgeobuf/formats/flatgeobuf) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

| Loader         | Characteristic                                                  |
| -------------- | --------------------------------------------------------------- |
| File Extension | `.fgb`,                                                         |
| File Type      | Binary                                                          |
| File Format    | [FlatGeobuf](/docs/modules/flatgeobuf/formats/flatgeobuf)       |
| Data Format    | [GeoJSONTable](/docs/specifications/category-gis), [ArrowTable](/docs/modules/schema/api-reference/apache-arrow) |
| Supported APIs | `load`, `loadInBatches`, `parse`, `parseSync`, `parseInBatches` |

## Usage

```typescript
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {load} from '@loaders.gl/core';

const geojsonFeatures = await load(url, FlatGeobufLoader);
const arrowTable = await load(url, FlatGeobufLoader, {
  flatgeobuf: {shape: 'arrow-table'}
});
```

## Outputs

### GeoJSON

The parser will return an array of [GeoJSON `features`](https://tools.ietf.org/html/rfc7946) in the coordinate system of the input data. If `gis.reproject` is enabled, coordinates will always be reprojected to WGS84.

### Arrow

Set `flatgeobuf.shape` to `'arrow-table'` to return an Apache Arrow table that preserves FlatGeobuf property columns and appends a WKB `geometry` column annotated with geospatial schema metadata. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

## Options

| Option             | Type                                                     | Default           | Description                                                       |
| ------------------ | -------------------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| flatgeobuf.shape   | `string`                                                 | `'geojson-table'` | Output shape: `'geojson-table'`, `'arrow-table'`, `'columnar-table'`, or `'binary'`. |
| gis.reproject      | boolean                                                  | `false`           | Whether to reproject input data into the WGS84 coordinate system. |

## Attribution

The `FlatGeobufLoader` wraps the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module which is published under the ISC license.
