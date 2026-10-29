JSON module · geospatial streaming

GeoJSON

# NDGeoJSONLoader

Stream GeoJSON features as newline-delimited records, keeping a large feature collection usable in incremental rendering and analysis workflows.

[GeoJSON format](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/geojson.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

GeoJSON[Try It](https://loaders.gl/next/examples/geospatial/geojson)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it reads

## Process features one line at a time.

NDGeoJSONLoader is the line-oriented GeoJSON path for files and streams that should not be held as one large FeatureCollection before processing begins.

01

Input

One GeoJSON feature per line

02

Output

Arrow tables and bounded Arrow batches

03

Geometry

GeoArrow WKB with feature property columns

04

Use cases

Large exports, maps, and stream processing

Detailed guide

## NDGeoJSONLoader reference

The sections below document the line-oriented formats, usage, output, and streaming behavior.

For GeoJSON, the root level FeatureCollection object is removed with a simple array of features, one per line

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).

| NDGeoJSONLoader |                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| File Extension  | `.ndgeojson`, `.geojsonl`, `.ldgeojson`                                                                                             |
| Media Type      | `application/geo+x-ndjson`, `application/geo+x-ldjson`, `application/geo+json-seq`                                                  |
| File Type       | Text                                                                                                                                |
| File Format     | [NDJSON](http://ndjson.org/), [LDJSON](http://jsonlines.org/), [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464) |
| Data Format     | [Arrow table](https://loaders.gl/next/docs/specifications/category-table.md), or explicit object rows                          |
| Supported APIs  | `load`, `parse`, `parseSync`, `parseInBatches`                                                                                      |

## Usage[​](#usage "Direct link to Usage")

```
import {load, parseInBatches} from '@loaders.gl/core';

import {NDGeoJSONLoader} from '@loaders.gl/tables/json';



const table = await load('features.ndgeojson', NDGeoJSONLoader);

console.log(table.data.numRows);



for await (const batch of await parseInBatches(chunks, NDGeoJSONLoader, {

  core: {batchSize: 1000}

})) {

  console.log(batch.data.numRows);

}
```

The package root exports a metadata-only loader. For `parseSync`, import `NDGeoJSONLoaderWithParser` from `@loaders.gl/tables/json/ndgeojson-loader`.

## Output and options[​](#output-and-options "Direct link to Output and options")

The default result is `{shape: 'arrow-table', schema, data}`, where `data` is an Apache Arrow table. Feature properties and IDs become columns and geometry uses the `geoarrow.wkb` extension. Feature IDs use the `id` column. If a feature ID collides with an existing property named `id`, Arrow conversion throws instead of overwriting either value; explicit object rows preserve both. Set `geojson.shape: 'object-row-table'` to return `{shape: 'object-row-table', data: Feature[]}` with complete, unmodified GeoJSON feature objects.

Arrow conversion accepts the same `json.schema`, `json.arrowConversion`, `json.geoarrowGeometryColumn`, and `geoarrow.encodingPreference` options as `GeoJSONLoader`. Streaming freezes the schema after the first nonempty batch; incompatible later records follow the shared JSON Arrow conversion policy. Provide `json.schema` when later records contain fields not represented in the first batch. Native/optimized geometry streams use a stable `geoarrow.geometry` union so later geometry types remain representable.

Input must contain one complete GeoJSON Feature per line. Blank lines, CRLF, a final line without a newline, and optional record-separator prefixes are accepted. Multiline JSON Text Sequence records are not supported. Streaming handles arbitrary UTF-8 chunk boundaries and emits at most `core.batchSize` rows per batch (default `1000`).
