import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';

# JSONLoader

<JsonDocsTabs active="jsonloader" />

Streaming loader for JSON encoded files.

`JSONLoader` loads complete JSON documents by default. It can also extract arrays as loaders.gl tables and stream rows from arrays inside larger JSON documents.

## Usage

For simple usage, load and parse a JSON file atomically:

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

For larger files, `JSONLoader` supports streaming JSON parsing. It yields batches of rows from one array. To parse a stream of GeoJSON, specify `options.json.jsonpaths` to stream the `features` array.

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader, {json: {jsonpaths: ['$.features']}});

for await (const batch of batches) {
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
        // Handle polygon
        break;
    }
  }
}
```

If no JSONPath is specified, the loader streams the first array it encounters in the JSON payload.

### Metadata Batches

When batch parsing an embedded JSON array as a table, set `metadata: true` to access the containing object. The loader yields an initial and final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result`.

```typescript
import {JSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader, {metadata: true});

for await (const batch of batches) {
  switch (batch.batchType) {
    case 'partial-result':
    case 'final-result':
      console.log(batch.container);
      break;
    case 'data':
      for (const feature of batch.data) {
        // Process streamed rows
      }
      break;
  }
}
```

### Streaming Semantics

- `JSONLoader` streams rows from a single JSON array. Every `batch.data` entry in a `data` batch is a complete row that the streaming parser has fully parsed before it is emitted.
- If `metadata: true` is set, the loader also yields `partial-result` and `final-result` batches that intentionally exclude the streamed array from `batch.container`. These batches describe only the surrounding container object; the streamed rows remain in the `data` batches.

To avoid confusion when inspecting batches:

1. Consume `batch.data` only when `batch.batchType === 'data'`; metadata batches appear incomplete by design because they omit the streamed array.
2. If you need the full root object after streaming, enable `metadata: true` and merge the streamed `data` rows back into the container object instead of relying on the metadata batches alone.

## Data Format

Parsed batches are of the format:

```ts
{
  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;
  jsonpath: string;

  data: any[] | any;
  bytesUsed: number;
  batchCount: number;
}
```

## JSONLoader Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`           | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false`                                                                                                                                          | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json.shape`           | [![Website shields.io](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)](http://shields.io) | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `object-row-table` | Selects row-table output or Apache Arrow output for tabular JSON results. |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`                                                                                                                                             | A list of JSON paths indicating the array that can be streamed.                                                                       |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`  | If `true`, yields an initial and final batch containing the partial and final result, i.e. the root object excluding the array being streamed. |

## JSONPaths

The loader implements a focused subset of the [IETF JSONPath specification (RFC 9535)](https://www.rfc-editor.org/rfc/rfc9535). See the [JSONPath support table](../jsonpath.md) for the full list of supported and unsupported features.

JSONPaths are used only to identify which array should be streamed, so selectors such as `$.features[*]` and `$.features[:]` are normalized to `$.features`. Descendant operators, element indexes, filters, and unions are not supported. Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
