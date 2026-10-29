GeoJSON loader

GeoJSON

# GeoJSONLoader

GeoJSONLoader preserves the familiar feature and geometry model while supporting binary geometry, Arrow tables, and incremental parsing for larger documents.

[GeoJSON format](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

⛶⛶ Explore fullscreen

GeoJSON[Try It](https://loaders.gl/next/examples/geospatial/geojson)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

The GeoArrow boundary

## Geometry columns stay Arrow columns.

GeoArrow adds geometry layouts and extension metadata to an ordinary Arrow table. The geometry travels with typed attributes instead of taking a separate application path.

Geospatial inputs

[**GeoParquet**file-level metadata↗](https://loaders.gl/next/docs/modules/tables/parquet/formats/geoparquet.md)[**GeoJSON**features to columns↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[**WKB / WKT**geometry wire formats↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)

encod&#x65;**→**

◎

GeoArrow table

geometry · attributes · CRS metadata

reus&#x65;**→**

Shared table work

[**Scan**project and filter↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[**Render**geometry and attributes↗](https://loaders.gl/next/docs/specifications/category-gis.md)[**Write**Arrow IPC or GeoParquet↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

GeoArrow is a convention on top of Arrow, so the result stays compatible with Arrow IPC and the broader Arrow ecosystem.

One loader, several useful shapes

## Use objects for clarity and columns for throughput.

Choose the output that matches the next stage of the application. The source document stays GeoJSON; the returned representation can be convenient objects or typed binary columns.

01

Features

GeoJSON table for mapping and inspection

02

Binary

Compact geometry buffers

03

Arrow

Typed columns with WKB geometry

04

Batches

Incremental results for NDJSON and large inputs

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

Streaming loader for GeoJSON encoded files.

Detailed guide

## GeoJSON usage and output shapes

The sections below cover simple loading, alternate shapes, streaming, reprojection, and loader options.

GeoJSON is a geospatial interchange format that uses JSON encoding. Use `GeoJSONLoader` for GeoJSON semantics such as features, geometries, feature collections, and GeoArrow WKB output; use `JSONLoader` for arbitrary JSON documents.

| GeoJSONLoader  |                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| File Extension | `.geojson`                                                                                                |
| Media Type     | `application/geo+json`                                                                                    |
| File Type      | Text                                                                                                      |
| File Format    | [GeoJSON](https://geojson.org)                                                                            |
| Data Format    | [GeoArrow Arrow table](https://loaders.gl/next/docs/specifications/category-gis.md#supported-shapes) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                                            |

## Usage[​](#usage "Direct link to Usage")

For simple usage, load a GeoJSON `FeatureCollection` as a loaders.gl Arrow table:

```
import {GeoJSONLoader} from '@loaders.gl/tables/json';

import {load} from '@loaders.gl/core';



const data = await load(url, GeoJSONLoader);
```

Use `geojson.shape` to request a different output shape.

```
const binary = await load(url, GeoJSONLoader, {

  geojson: {shape: 'binary-feature-collection'}

});



const arrowTable = await load(url, GeoJSONLoader, {

  geojson: {shape: 'arrow-table'}

});
```

`GeoJSONLoader` defaults to `geojson.shape: 'arrow-table'`, converting features to a GeoArrow-compatible Arrow table. Set `geojson.shape: 'geojson-table'` when an object-row `GeoJSONTable` is required for compatibility. Feature `properties` become regular columns and the geometry is written to a binary `geometry` column with `geoarrow.wkb` metadata by default. Set `geoarrow.encodingPreference` to `'optimized'` for native coordinate buffers or to `'geoarrow.geometry'` for a stable dense union. Use `json.geoarrowGeometryColumn` to choose a different geometry column name.

```
const nativeTable = await load(url, GeoJSONLoader, {

  geojson: {shape: 'arrow-table'},

  geoarrow: {encodingPreference: 'optimized'}

});
```

For larger files, GeoJSONLoader supports streaming JSON parsing, in which case it yields batches of rows from one array. By default, streamed GeoJSON reads `$.features`. You can override `options.json.jsonpaths` when the feature array is stored elsewhere.

```
import {GeoJSONLoader} from '@loaders.gl/tables/json';

import {loadInBatches} from '@loaders.gl/core';



const batches = await loadInBatches('geojson.json', GeoJSONLoader);



for await (const batch of batches) {

  // batch.data will contain a number of rows

  for (const feature of batch.data) {

    switch (feature.geometry.type) {

      case 'Polygon':

      ...

    }

  }

}
```

When batch parsing an embedded JSON array as a table, it is possible to get access to the containing object supplying the `{metadata: true}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result` respectively.

```
import {GeoJSONLoader} from '@loaders.gl/tables/json';

import {loadInBatches} from '@loaders.gl/core';



const batches = await loadInBatches('geojson.json', GeoJSONLoader);



for await (const batch of batches) {

  switch (batch.batchType) {

    case 'partial-result': // contains fields seen so far

    case 'final-result': // contains all fields except the streamed array

      console.log(batch.container);

      break;

    case 'data':

      // batch.data will contain a number of rows

      for (const feature of batch.data) {

        switch (feature.geometry.type) {

          case 'Polygon':

          ...

        }

      }

  }

}
```

## Data Format[​](#data-format "Direct link to Data Format")

Parsed batches are of the format

```
{

  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;

  jsonpath: string;



  // standard batch payload

  data: any[] | any;

  bytesUsed: number;

  batchCount: number;

}
```

## Options[​](#options "Direct link to Options")

Supports table category options such as `batchType` and `batchSize`.

| Option                           | From                                                                                   | Type                                                   | Default                                                                                                                      | Description                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geojson.shape`                  |                                                                                        | `string`                                               | `'arrow-table'`                                                                                                              | Requested output shape. Supported values are `'arrow-table'`, `'geojson-table'`, and `'binary-feature-collection'`.                                                                                                                                                                                                                                                                |
| `json.schema`                    |                                                                                        | `Schema \| arrow.Schema`                               | `undefined`                                                                                                                  | Optional full output schema used when `geojson.shape` is `'arrow-table'`. The schema must include the geometry column.                                                                                                                                                                                                                                                             |
| `json.arrowConversion`           |                                                                                        | `object`                                               | `{onTypeMismatch: 'error', onMissingField: 'error', onExtraField: 'error', integerConversion: 'error', logRecoveries: true}` | Optional Arrow conversion policy for `geojson.shape: 'arrow-table'`. `onTypeMismatch: 'null'`, `onMissingField: 'null'`, and `integerConversion: 'null'` write `null` only for nullable fields. `onExtraField: 'drop'` omits fields that are not in the schema. `integerConversion: 'clamp-and-round'` applies lossy integer conversion, and `'warn'` does the same while logging. |
| `json.arrowConversion.viewTypes` |                                                                                        | `'never' \| 'prefer' \| 'require'`                     | `'never'`                                                                                                                    | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode.                                                                                                                                                                                                                                                                      |
| `json.geoarrowGeometryColumn`    |                                                                                        | `string`                                               | `'geometry'`                                                                                                                 | Geometry column name used for GeoArrow WKB output. Requires `geojson.shape: 'arrow-table'`.                                                                                                                                                                                                                                                                                        |
| `geoarrow.encodingPreference`    |                                                                                        | `'geoarrow.wkb' \| 'geoarrow.geometry' \| 'optimized'` | `'geoarrow.wkb'`                                                                                                             | Arrow geometry representation. WKB is compact and compatible; `geoarrow.geometry` is a stable dense union; `optimized` selects a concrete native encoding for homogeneous data and a dense union for mixed data.                                                                                                                                                                   |
| `json.jsonpaths`                 | \[![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]`                                             | `['$.features']`                                                                                                             | A list of JSON paths (see below) indicating the array that can be streamed.                                                                                                                                                                                                                                                                                                        |
| `core.metadata`                  | \[![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`                                              | `false`                                                                                                                      | If `true`, yields an initial and final batch containing the partial and final result (i.e. the root object, excluding the array being streamed).                                                                                                                                                                                                                                   |

## JSONPaths[​](#jsonpaths "Direct link to JSONPaths")

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](https://loaders.gl/next/docs/modules/tables/json/jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution[​](#attribution "Direct link to Attribution")

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
