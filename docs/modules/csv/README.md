# Overview

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/csv` module handles tabular data stored in CSV and TSV format
[CSV/DSV file format](https://en.wikipedia.org/wiki/Comma-separated_values).

CSV sources support metadata discovery, streaming projection and limits, and correct residual
predicates through the common scan contract.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/csv
```

## Loaders and Writers

| API                                                             | Description                                    |
| --------------------------------------------------------------- | ---------------------------------------------- |
| [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader)       | Loads CSV and TSV data as loaders.gl tables. |
| [`CSVWorkerLoader`](/docs/modules/csv/api-reference/csv-loader) | Deprecated alias for `CSVLoader`.            |
| [`CSVWriter`](/docs/modules/csv/api-reference/csv-writer)       | Writes loaders.gl tables as CSV text.        |

## Additional APIs

See table category.

## Attributions

CSVLoader is based on a fork of the [papaparse](https://github.com/mholt/PapaParse) module, under MIT license.
