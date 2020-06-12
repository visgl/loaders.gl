# JSONLoader

Streaming loader for JSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.json`,                                             |
| File Type      | Text                                                 |
| File Format    | [JSON](https://www.json.org/json-en.html)            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from one array. To e.g. parse a stream of GeoJSON, the user can specify the `options.json.jsonpaths` to stream the `features` array.

```js
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader, {json: {jsonpaths: ['$.features']}});

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

If no JSONPath is specified the loader will stream the first array it encounters in the JSON payload.

When batch parsing an embedded JSON array as a table, it is possible to get access to the containing object using the `{json: {_rootObjectBatches: true}}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `root-object-batch-partial` and `root-object-batch-complete` respectively.

```js
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader);

for await (const batch of batches) {
  switch (batch.batchType) {
    case 'root-object-batch-partial': // contains fields seen so far
    case 'root-object-batch-complete': // contains all fields except the streamed array
      console.log(batch.container);
      break;
    default:
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

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                    | From                                                                                  | Type       | Default | Description                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`              | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | Boolean    | `false` | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json.jsonpaths`          | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`    | A list of JSON paths (see below) indicating the array that can be streamed.                                                           |
| `json._rootObjectBatches` | [![Website shields.io](https://img.shields.io/badge/v2.1-blue.svg?style=flat-square)] | Boolean    | `false` | Yield an initial and final batch containing the partial and complete root object (excluding the array being streamed).                |

## JSONPaths

A minimal subset of the JSONPath syntax is supported, to specify which array in a JSON object should be streamed as batchs.

`$.component1.component2.component3`

- No support for wildcards, brackets etc. Only paths starting with `$` (JSON root) are supported.
- Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
