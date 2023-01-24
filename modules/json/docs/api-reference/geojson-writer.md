# GeoJSONWriter

Streaming loader for GeoJSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.geojson`                                           |
| Media Type     | `application/geo+json`                               |
| File Type      | Text                                                 |
| File Format    | [GeoJSON][format_geojson]                            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `encode`, `encodeSync`, `encodeÓInBatches`           |

[format_geojson]: https://geojson.org

## Usage

For simple usage, you can encode a table into a JSON "file" atomically:

```js
import {GeoJSONLoader} from '@loaders.gl/json';
import {encode} from '@loaders.gl/core';

const data = await encode(url, GeoJSONLoader, {json: options});
```

### Streaming and JSON paths

For larger files, GeoJSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from one array.

```js
import {GeoJSONLoader} from '@loaders.gl/json';
import {encodeInBatches} from '@loaders.gl/core';

const batches = await encodeInBatches('geojson.json', GeoJSONLoader, {json: {jsonpaths: ['$.features']}});

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

To parse a stream of GeoJSON, the user can specify the `options.json.jsonpaths` to stream the `features` array.

If no JSONPath is specified the loader will stream the first array it encounters in the JSON payload.


## Data Format

Encoded batches are array buffers or strings

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`           | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false`                                                                                                                                          | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`                                                                                                                                             | A list of JSON paths (see below) indicating the array that can be streamed.                                                           |

## JSONPaths

A minimal subset of the JSONPath syntax is supported, to specify which array in a JSON object should be streamed as batchs.

`$.component1.component2.component3`

- No support for wildcards, brackets etc. Only paths starting with `$` (JSON root) are supported.
- Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
