# CSVWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

Writes tabular data into comma-separated value and [delimiter-separated value](https://en.wikipedia.org/wiki/Delimiter-separated_values) encoding.

| Writer         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [CSV](/docs/modules/csv/formats/csv)                |
| Data Format    | [Tables](/docs/specifications/category-table)       |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
| Supported APIs | `encode`, `encodeTextSync`                          |

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Table} from '@loaders.gl/schema';
import {CSVWriter} from '@loaders.gl/csv';

declare const table: Table;

const data = await encode(table, CSVWriter); // ArrayBuffer
const text = CSVWriter.encodeTextSync(table, {csv: options}); // string
```

## CSVWriter Options

| Option                | Type      | Default | Description                                                                        |
| --------------------- | --------- | ------- | ---------------------------------------------------------------------------------- |
| `csv.useDisplayNames` | `boolean` | `false` | If `true`, use field `metadata.displayName` values as column names when available. |

## CSVArrowWriter

`CSVArrowWriter` writes Apache Arrow tables to CSV text.

| Writer         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [CSV](/docs/modules/csv/formats/csv)                |
| Data Format    | [Arrow Tables](/docs/specifications/category-table) |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
| Supported APIs | `encode`, `encodeTextSync`                          |

```typescript
import {encode} from '@loaders.gl/core';
import type {ArrowTable} from '@loaders.gl/schema';
import {CSVArrowWriter} from '@loaders.gl/csv';

declare const table: ArrowTable;

const data = await encode(table, CSVArrowWriter); // ArrayBuffer
const text = CSVArrowWriter.encodeTextSync(table, {csv: options}); // string
```

`CSVArrowWriter` supports the same writer options as `CSVWriter`.
