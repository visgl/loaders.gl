# GeoJSONLoader

Streaming loader for GeoJSON encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.geojson`                                              |
| Media Type     | `application/geo+json` |
| File Type      | Text                                                 |
| File Format    | [GeoJSON][format_geojson]            |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

[format_geojson]: https://geojson.org

## Usage

For simple usage, you can load and parse a JSON file atomically:

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoJSONLoader, {json: options});
```

For larger files, GeoJSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from one array.
To parse a stream of GeoJSON, the user can specify the `options.json.jsonpaths` to stream the `features` array.

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', GeoJSONLoader, {json: {jsonpaths: ['$.features']}});

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

When batch parsing an embedded JSON array as a table, it is possible to get access to the containing object supplying the `{metadata: true}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result` respectively.

```typescript
import {GeoJSONLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', GeoJSONLoader);

for await (const batch of batches) {
  switch (batch.batchType) {
    case 'partial-result': // contains fields seen so far
    case 'final-result': // contains all fields except the streamed array
      console.log(batch.container);
      break;
    case 'data:
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

## Data Format

Parsed batches are of the format

```ts
{
  batchType: 'metadata' | 'partial-result' | 'final-result' | undefined;
  jsonpath: string;

  // standard batch payload
  data: any[] | any;
  bytesUsed: number;
  batchCount: number;
}
```

## Options

Supports table category options such as `batchType` and `batchSize`.

| Option                 | From                                                                                  | Type       | Default                                                                                                                                          | Description                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `json.table`           | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false`                                                                                                                                          | Parses non-streaming JSON as table, i.e. return the first embedded array in the JSON. Always `true` during batched/streaming parsing. |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`                                                                                                                                             | A list of JSON paths (see below) indicating the array that can be streamed.                                                           |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`  | If `true`, yields an initial and final batch containing the partial and final result (i.e. the root object, excluding the array being streamed). |

## JSONPaths

A minimal subset of the JSONPath syntax is supported, to specify which array in a JSON object should be streamed as batchs.

`$.component1.component2.component3`

- No support for wildcards, brackets etc. Only paths starting with `$` (JSON root) are supported.
- Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
