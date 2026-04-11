# Overview

The `@loaders.gl/csv` module handles tabular data stored in CSV and TSV format
[CSV/DSV file format](https://en.wikipedia.org/wiki/Comma-separated_values).

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/csv
```

## Loaders and Writers

| API                                                             | Description                                    |
| --------------------------------------------------------------- | ---------------------------------------------- |
| [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader#csvloader)            | Loads CSV and TSV data as loaders.gl tables.   |
| [`CSVWorkerLoader`](/docs/modules/csv/api-reference/csv-loader#csvloader)      | Worker-enabled CSV loader.                     |
| [`CSVArrowLoader`](/docs/modules/csv/api-reference/csv-loader#csvarrowloader)  | Loads CSV and TSV data as Apache Arrow tables. |
| [`CSVWriter`](/docs/modules/csv/api-reference/csv-writer)       | Writes loaders.gl tables as CSV text.          |
| [`CSVArrowWriter`](/docs/modules/csv/api-reference/csv-writer)  | Writes Apache Arrow tables as CSV text.        |

## Additional APIs

See table category.

## Attributions

CSVLoader is based on a fork of the [papaparse](https://github.com/mholt/PapaParse) module, under MIT license.
