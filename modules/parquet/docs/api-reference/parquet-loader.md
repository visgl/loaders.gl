# ParquetLoader

Streaming loader for Apache Parquet encoded files.

| Loader         | Characteristic                                       |
| -------------- | ---------------------------------------------------- |
| File Extension | `.parquet`,                                          |
| File Type      | Binary                                               |
| File Format    | [Parquet](https://parquet.apache.org/documentation/latest) |
| Data Format    | [Classic Table](/docs/specifications/category-table) |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`       |

## Usage

```js
import {ParquetLoader} from '@loaders.gl/parquet';
import {load} from '@loaders.gl/core';

const data = await load(url, ParquetLoader, {parquet: options});
```

The ParquetLoader supports streaming Parquet parsing, in which case it will yield "batches" of rows from one array. To e.g. parse a stream of GeoParquet, the user can specify the `options.parquet.parquetpaths` to stream the `features` array.

```js
import {ParquetLoader} from '@loaders.gl/parquet';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geo.parquet', ParquetLoader, {parquet: options}});

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

If no ParquetPath is specified the loader will stream the first array it encounters in the Parquet payload.

When batch parsing an embedded Parquet array as a table, it is possible to get access to the containing object supplying the `{metadata: true}` option.

The loader will yield an initial and a final batch with `batch.container` providing the container object and `batch.batchType` set to `partial-result` and `final-result` respectively.

```js
import {ParquetLoader} from '@loaders.gl/json';
import {loadInBatches} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', ParquetLoader);

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
| `json.table`           | [![Website shields.io](https://img.shields.io/badge/v2.0-blue.svg?style=flat-square)] | `boolean`  | `false`                                                                                                                                          | Parses non-streaming Parquet as table, i.e. return the first embedded array in the Parquet. Always `true` during batched/streaming parsing. |
| `json.jsonpaths`       | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `string[]` | `[]`                                                                                                                                             | A list of Parquet paths (see below) indicating the array that can be streamed.                                                           |
| `metadata` (top level) | [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)] | `boolean`  | If `true`, yields an initial and final batch containing the partial and final result (i.e. the root object, excluding the array being streamed). |

## ParquetPaths

A minimal subset of the ParquetPath syntax is supported, to specify which array in a Parquet object should be streamed as batchs.

`$.component1.component2.component3`

- No support for wildcards, brackets etc. Only paths starting with `$` (Parquet root) are supported.
- Regardless of the paths provided, only arrays will be streamed.

## Attribution

This loader is based on a fork of dscape's [`clarinet`](https://github.com/dscape/clarinet) under BSD 2-clause license.
