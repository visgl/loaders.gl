FlatGeobuf loader

![](/next/images/format-logos/flatgeobuf-logo.png)

# Decode indexed features into the shape your app needs.

FlatGeobufLoader reads binary feature records and lets applications choose a familiar GeoJSON table, Arrow table, columnar table, or binary geometry result.

[FlatGeobuf format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[FlatGeobuf module](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)

![From-v3.1](https://img.shields.io/badge/From-v3.1-blue.svg?style=flat-square)![arrow output from v5.0](https://img.shields.io/badge/arrow_output-From_v5.0-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

![](/next/images/format-logos/flatgeobuf-logo.png)[Try It](https://loaders.gl/next/examples/geospatial/flatgeobuf)[Overview](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)[Format](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/format.md)[FlatGeobufLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-loader.md)[FlatGeobufSourceLoader](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/api-reference/flatgeobuf-source-loader.md)

Choose the boundary

## Keep features familiar, or make columns explicit.

The default result is an Arrow table for typed columns and direct table interoperability. GeoJSON and binary shapes remain available when application code needs them.

01

Default

ArrowTable with typed columns and WKB geometry

02

GeoJSON

GeoJSONTable for application code

03

Index

Bounding-box filtering before decode

04

Streaming

Source APIs for incremental reads

Loader for the [FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md) format, a binary FlatBuffers-encoded format that defines geospatial geometries.

Detailed guide

## Output shapes and loader options

The sections below cover usage, result shapes, GeoJSON and Arrow output, reprojection, and option details.

## Usage[​](#usage "Direct link to Usage")

```
import {FlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf';

import {load} from '@loaders.gl/core';



const arrowTable = await load(url, FlatGeobufLoader);

const geojsonTable = await load(url, FlatGeobufLoader, {

  flatgeobuf: {shape: 'geojson-table'}

});
```

## Outputs[​](#outputs "Direct link to Outputs")

### Shapes[​](#shapes "Direct link to Shapes")

`FlatGeobufLoader` returns loaders.gl `ArrowTable` objects by default. Set `flatgeobuf.shape` to select another representation.

| Shape             | Output                                    |
| ----------------- | ----------------------------------------- |
| `geojson-table`   | loaders.gl GeoJSON table                  |
| `arrow-table`     | loaders.gl `ArrowTable` with WKB geometry |
| `columnar-table`  | loaders.gl columnar table                 |
| `binary-geometry` | loaders.gl binary feature collection      |

### GeoJSONTable[​](#geojsontable "Direct link to GeoJSONTable")

The parser will return an array of [GeoJSON `features`](https://tools.ietf.org/html/rfc7946) in the coordinate system of the input data. Set `gis.reproject: true` to transform coordinates; use `gis.targetCrs` to select the output CRS. If no target is provided, WGS84 is used for compatibility. Unknown source CRS metadata and unsupported requested transformations throw `CRSReprojectionError`.

### Arrow[​](#arrow "Direct link to Arrow")

By default, `FlatGeobufLoader` returns an Apache Arrow table that preserves FlatGeobuf property columns and appends a WKB `geometry` column annotated with geospatial schema metadata. Set `flatgeobuf.shape` to `'arrow-table'` explicitly when using another default or shared option bag. ![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)

## Options[​](#options "Direct link to Options")

| Option           | Type            | Default                                | Description                                                                                   |
| ---------------- | --------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| flatgeobuf.shape | `string`        | `'arrow-table'`                        | Output shape: `'geojson-table'`, `'arrow-table'`, `'columnar-table'`, or `'binary-geometry'`. |
| gis.reproject    | boolean         | `false`                                | Whether to transform input data into `gis.targetCrs` (WGS84 when omitted).                    |
| gis.targetCrs    | `CRSDefinition` | `'WGS84'` when reprojection is enabled | Output CRS for transformed coordinates.                                                       |

## Remarks[​](#remarks "Direct link to Remarks")

The `FlatGeobufLoader` wraps the [`flatgeobuf`](https://github.com/bjornharrtell/flatgeobuf) NPM module which is published under the ISC license.
