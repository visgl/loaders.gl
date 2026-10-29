JSON module · geospatial writer

GeoJSON

# GeoJSONWriter

Encode loaders.gl geospatial tables as GeoJSON, keeping feature geometry and properties in a format that mapping tools and web APIs understand.

[GeoJSON format](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

GeoJSON[Try It](https://loaders.gl/next/examples/geospatial/geojson)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it writes

## Send table data back to the map as features.

GeoJSONWriter converts table-shaped geospatial data into a FeatureCollection or feature stream, with an incremental path for larger outputs.

01

Input

GeoJSON tables and geometry columns

02

Output

GeoJSON features and collections

03

Streaming

Incremental feature batches

04

Boundary

Readable web and GIS interchange

Detailed guide

## GeoJSONWriter reference

The sections below document format metadata, usage, streaming, output shapes, and writer options.

Streaming writer for GeoJSON encoded files.

| GeoJSONWriter  |                                                                                     |
| -------------- | ----------------------------------------------------------------------------------- |
| File Extension | `.geojson`                                                                          |
| Media Type     | `application/geo+json`                                                              |
| File Type      | Text                                                                                |
| File Format    | [GeoJSON](https://geojson.org)                                                      |
| Data Format    | [Classic Table](https://loaders.gl/next/docs/specifications/category-table.md) |
| Supported APIs | `encode`, `encodeInBatches`                                                         |

## Usage[​](#usage "Direct link to Usage")

Encode a loaders.gl table containing geometry into a GeoJSON FeatureCollection. For example, an object-row table can contain WKT geometry strings in a named column:

```
import {GeoJSONWriter} from '@loaders.gl/tables/json';

import {encode} from '@loaders.gl/core';



const table = {

  shape: 'object-row-table',

  schema: {

    fields: [{name: 'geometry', type: 'utf8'}, {name: 'name', type: 'utf8'}],

    metadata: {}

  },

  data: [{geometry: 'POINT (1 2)', name: 'Example'}]

};

const bytes = await encode(table, GeoJSONWriter);

const text = new TextDecoder().decode(bytes);
```

## Streaming output[​](#streaming-output "Direct link to Streaming output")

Pass an iterable of table batches to `encodeInBatches`. Each output chunk is an `ArrayBuffer` containing UTF-8 text; join chunks in order to form the complete GeoJSON document. Output chunks are not parsed feature batches.

```
import {GeoJSONWriter} from '@loaders.gl/tables/json';

import {encodeInBatches} from '@loaders.gl/core';



const chunks = await encodeInBatches(tableBatches, GeoJSONWriter);

for await (const bytes of chunks) {

  // Forward each encoded chunk to the application's output stream.

  await output.write(bytes);

}
```

## Options[​](#options "Direct link to Options")

| Option                   | Default | Description                                                    |
| ------------------------ | ------- | -------------------------------------------------------------- |
| `geojson.featureArray`   | `false` | Writes a feature array instead of a FeatureCollection wrapper. |
| `geojson.geometryColumn` | `null`  | Index of the geometry column; inferred when omitted.           |
| `chunkSize`              | `10000` | Target encoded chunk size in bytes.                            |

`GeoJSONWriter` supports asynchronous `encode` and `encodeInBatches`. It does not provide `encodeSync`. JSONPath options belong to JSON parsing and are not writer options.
