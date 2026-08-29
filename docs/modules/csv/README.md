---
title: '@loaders.gl/csv'
description: Stream CSV and TSV data into reusable table shapes and write it back as text.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StructuredDataPathGraphic} from '@site/src/components/docs/structured-data-path-graphic';

<DocPageHeader
  eyebrow="Table module"
  title="Turn delimited text into a table path."
  description="The CSV module handles CSV and TSV input through the same loaders.gl APIs used by binary table formats. It can materialize a table, emit batches as records arrive, or write compatible data back to text."
  tone="cyan"
  meta={['CSV / TSV', 'Streaming', 'Table output']}
  links={[
    {label: 'Table category', to: '/docs/specifications/category-table'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<StructuredDataPathGraphic />

<DocOrientation
  eyebrow="The CSV path"
  title="Read rows incrementally when the file is large."
  description="CSV is simple to exchange but expensive to hold as one string. The loader can parse records into table batches so applications can process, filter, or display them as they arrive."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Comma-, tab-, or delimiter-separated text'},
    {label: 'Output', value: 'Rows, columnar tables, or Arrow tables'},
    {label: 'Streaming', value: 'Async batches with projection and limits'},
    {label: 'Write', value: 'Encode compatible table data as CSV text'}
  ]}
/>

The `@loaders.gl/csv` module handles tabular data stored in CSV and TSV format
[CSV/DSV file format](https://en.wikipedia.org/wiki/Comma-separated_values).

<ReferenceBoundary
  title="CSV module details"
  description="The sections below cover installation, loaders, writers, parsing options, and table output."
  tone="cyan"
/>

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
