CSV module · writer API

CSV

# CSVWriter

Write loaders.gl tables back to CSV or another delimiter-separated text representation, including Arrow-backed tables produced by CSVLoader.

[CSV format](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[CSV module](https://loaders.gl/next/docs/modules/tables/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv.md)

CSV[Try It](https://loaders.gl/next/examples/geospatial/csv)[Overview](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[Format](https://loaders.gl/next/docs/modules/tables/csv/format.md)[CSVLoader](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[CSVWriter](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/tables/csv/benchmarks.md)

What it accepts

## Export the same table in a format people can open anywhere.

CSVWriter accepts loaders.gl table data and turns it into interoperable text. Use it at the application boundary when a table needs to leave the binary pipeline.

01

Input

Rows, columns, or Arrow-backed tables

02

Output

CSV or delimiter-separated text

03

Names

Optional display names from metadata

04

API

Async encode or synchronous text output

Detailed guide

## CSVWriter reference

The sections below document imports, encoding forms, and writer options.

`CSVWriter` writes tabular data into comma-separated value and delimiter-separated value encoding.

## Usage[​](#usage "Direct link to Usage")

```
import {encode} from '@loaders.gl/core';

import type {Table} from '@loaders.gl/core/schema';

import {CSVWriter} from '@loaders.gl/tables/csv';



declare const table: Table;



const data = await encode(table, CSVWriter); // ArrayBuffer

const text = CSVWriter.encodeTextSync(table, {csv: options}); // string
```

`CSVWriter` can also encode Arrow-backed tables returned by `CSVLoader` with `csv.shape: 'arrow-table'`.

## CSVWriter Options[​](#csvwriter-options "Direct link to CSVWriter Options")

| Option                | Type      | Default | Description                                                                        |
| --------------------- | --------- | ------- | ---------------------------------------------------------------------------------- |
| `csv.useDisplayNames` | `boolean` | `false` | If `true`, use field `metadata.displayName` values as column names when available. |
