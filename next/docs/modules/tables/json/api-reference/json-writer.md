JSON module · writer API

![](/next/images/format-logos/json-logo.gif)JSON

# JSONWriter

Encode loaders.gl tables as JSON text, including readable GeoJSON conversion for GeoArrow WKB columns when the output needs to cross into a JSON-oriented system.

[JSON format](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it writes

## Leave a binary table as ordinary JSON when you need to.

JSONWriter accepts row, columnar, and Arrow-backed tables and serializes them as JSON rows. GeoArrow WKB columns can be decoded to readable GeoJSON geometry by default.

01

Input

Row, columnar, or Arrow tables

02

Output

JSON text or an ArrayBuffer

03

Geometry

WKB to GeoJSON by default

04

Control

Shape, wrapper, and GeoArrow options

Detailed guide

## JSONWriter reference

The sections below document usage, table conversion, GeoArrow handling, and writer options.

`JSONWriter` writes loaders.gl tables as JSON text.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Table} from '@loaders.gl/core/schema';

import {JSONWriter} from '@loaders.gl/tables/json';



declare const table: Table;



const data = await encode(table, JSONWriter); // ArrayBuffer

const text = JSONWriter.encodeTextSync(table, {json: options}); // string
```

`JSONWriter` accepts loaders.gl row, columnar, and Arrow tables. Arrow table inputs are serialized as JSON row objects by default.

```
const json = await encode(arrowTable, JSONWriter, {

  json: {shape: 'arrow-table'}

});
```

If an Arrow table has a `geoarrow.wkb` geometry column, `JSONWriter` decodes that column to GeoJSON geometry objects before serializing. This keeps JSON output readable while preserving the writer's normal array-of-rows shape.

```
const json = await encode(geoArrowTable, JSONWriter);

// [{"name":"A","geometry":{"type":"Point","coordinates":[1,2]}}]
```

Set `json.geoarrow: 'none'` to serialize the raw WKB values instead.

## Data Format[​](#data-format "Direct link to Data Format")

Encoded batches are array buffers or strings.

## JSONWriter Options[​](#jsonwriter-options "Direct link to JSONWriter Options")

| Option          | Type                                                       | Default              | Description                                                                                                                              |
| --------------- | ---------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `json.shape`    | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'object-row-table'` | Requested JSON row shape. `'arrow-table'` is accepted for Arrow table inputs and serializes rows as objects.                             |
| `json.geoarrow` | `'auto' \| 'none'`                                         | `'auto'`             | Controls GeoArrow WKB decoding. `'auto'` decodes `geoarrow.wkb` columns to GeoJSON geometry objects. `'none'` serializes the raw values. |
| `json.wrapper`  | `(table: RowObject[] \| RowArray[]) => unknown`            |                      | Wraps the encoded table rows in a custom JSON value.                                                                                     |
