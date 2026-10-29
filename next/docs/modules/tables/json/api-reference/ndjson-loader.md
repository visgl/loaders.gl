JSON module · streaming loader

![](/next/images/format-logos/json-logo.gif)JSON

# NDJSONLoader

Read one JSON value per line and process the stream incrementally, with Arrow batches by default and an explicit row-table compatibility path.

[JSON module](https://loaders.gl/next/docs/modules/tables/json.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[Parse in batches](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

![](/next/images/format-logos/json-logo.gif)JSON[Try It](https://loaders.gl/next/examples/table/json)[Overview](https://loaders.gl/next/docs/modules/tables/json/formats/json.md)[Format](https://loaders.gl/next/docs/modules/tables/json/format.md)[JSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[JSONTableLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-table-loader.md)[NDJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[GeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[NDGeoJSONLoader](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndgeojson-loader.md)[JSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-writer.md)[GeoJSONWriter](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-writer.md)

What it reads

## Treat each line as a record as soon as it arrives.

NDJSON is deliberately line-oriented, which makes it a practical format for logs, exports, and large table streams. NDJSONLoader turns those lines into bounded batches.

01

Formats

NDJSON, JSONL, and LDJSON

02

Input

One JSON value per line

03

Output

Row tables or Arrow tables

04

APIs

Atomic and incremental loading

Detailed guide

## NDJSONLoader reference

The sections below cover format metadata, atomic and streaming usage, Arrow output, and parsing options.

Streaming loader for NDJSON encoded files and related formats (LDJSON and JSONL).

| Characteristic | Value                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.ndjson`, `.jsonl`, `.ldjson`                                                                                                      |
| Media Type     | `application/x-ndjson`, `application/x-ldjson`, `application/json-seq`                                                              |
| File Type      | Text                                                                                                                                |
| File Format    | [NDJSON](http://ndjson.org/), [LDJSON](http://jsonlines.org/), [JSON Text Sequences](https://datatracker.ietf.org/doc/html/rfc7464) |
| Data Format    | [Tables](https://loaders.gl/next/docs/specifications/category-table.md)                                                        |
| Supported APIs | `load`, `parse`, `parseSync`, `parseInBatches`                                                                                      |

`NDJSONLoader` loads NDJSON data as loaders.gl `ArrowTable` batches by default. Set `ndjson.shape: 'object-row-table'` or `ndjson.shape: 'array-row-table'` for row-oriented batches.

## Usage[​](#usage "Direct link to Usage")

```
import {NDJSONLoader} from '@loaders.gl/tables/json';

import {load} from '@loaders.gl/core';



const data = await load(url, NDJSONLoader, {ndjson: options});
```

The NDJSONLoader supports streaming NDJSON parsing, in which case it will yield "batches" of rows, where each row is a parsed line from the NDJSON stream.

```
import {NDJSONLoader} from '@loaders.gl/tables/json';

import {loadInBatches} from '@loaders.gl/core';



const batches = await loadInBatches('ndjson.ndjson', NDJSONLoader, {

  ndjson: {shape: 'object-row-table'}

});



for await (const batch of batches) {

  // batch.data will contain a number of rows

  for (const obj of batch.data) {

    // Process obj

    ...

  }

}
```

To request Arrow output explicitly, set `ndjson.shape: 'arrow-table'` (this is the default).

```
import {load, loadInBatches} from '@loaders.gl/core';

import {NDJSONLoader} from '@loaders.gl/tables/json';



const table = await load(url, NDJSONLoader, {

  ndjson: {shape: 'arrow-table'}

});



const batches = await loadInBatches('ndjson.ndjson', NDJSONLoader, {

  batchSize: 1000,

  ndjson: {shape: 'arrow-table'}

});
```

`NDJSONLoader` also accepts the deprecated `json.shape` alias for shape selection. `ndjson.shape` takes precedence, and schema/recovery options remain under `ndjson.*`. In Arrow mode, `ndjson.schema` accepts either a loaders.gl `Schema` or Apache Arrow `Schema`. `ndjson.arrowConversion` has the same strict-by-default recovery policy as `JSONTableLoader`: type mismatches, missing fields, and integer conversion issues throw unless configured to recover, and extra fields throw unless configured to drop. GeoJSON feature rows are converted as generic nested JSON rows; use `GeoJSONLoader` with `geojson.shape: 'arrow-table'` for GeoArrow WKB output.

## Data Format[​](#data-format "Direct link to Data Format")

Parsed `NDJSONLoader` batches are of the format.

```
{

  // standard batch payload

  data: any[] | any;

  bytesUsed: number;

  batchCount: number;

}
```

Each element in the `data` array corresponds to a line (Object) in the NDJSON data.

## Options[​](#options "Direct link to Options")

Supports the table category options such as `batchSize`.

| Option                             | Type                                                       | Default                | Description                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ndjson.shape`                     | `string`                                                   | `'arrow-table'`        | Requested table shape. Supported values are `'object-row-table'`, `'array-row-table'`, and `'arrow-table'`.                              |
| `ndjson.schema`                    | `Schema \| arrow.Schema`                                   | `undefined`            | Optional schema used when `ndjson.shape` is `'arrow-table'`.                                                                             |
| `ndjson.arrowConversion`           | `object`                                                   | strict recovery policy | Optional Arrow conversion policy. Supports `onTypeMismatch`, `onMissingField`, `onExtraField`, `integerConversion`, and `logRecoveries`. |
| `ndjson.arrowConversion.viewTypes` | `'never' \| 'prefer' \| 'require'`                         | `'never'`              | Controls whether supported Arrow runtimes emit `BinaryView` and `Utf8View`, with fallback in `'prefer'` mode.                            |
| `json.shape`                       | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'arrow-table'`        | Deprecated alias for `ndjson.shape`; `ndjson.shape` takes precedence.                                                                    |

## Worker batches[​](#worker-batches "Direct link to Worker batches")

This loader supports stateful worker batch parsing with `core.worker: true`, cancellation via `signal`, and decoded-row progress via `onProgress`. See [JSON worker batches](https://loaders.gl/next/docs/modules/tables/json.md#parsing-batches-in-workers) for streaming behavior, schemas, backpressure, and Node/custom-worker options.

Arrow tables return as directly transferred column buffers. Row tables and container metadata return as binary JSON frames decoded on the caller, preserving heterogeneous values without Arrow coercion. Decoded row objects are never structured-cloned across the worker boundary.
