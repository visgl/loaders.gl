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

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from the first array it encounters in the JSON. To e.g. parse a stream of GeoJSON:

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader);

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

When batch parsing an embedded JSON array as a table, it is possible to get access to the containing object using the `{json: {_rootObjectBatches: true}}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `root-object-batch-partial` and `root-object-batch-complete` respectively.

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await loadInBatches('geojson.json', JSONLoader);

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

| Option                    | From | Type    | Default | Description                                                                                                                           |
| ------------------------- | ---- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`              | v2.0 | Boolean | `false` | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json._rootObjectBatches` | v2.1 | Boolean | `false` | Yield an initial and final batch containing the partial and complete root object (excluding the array being streamed).                |

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
