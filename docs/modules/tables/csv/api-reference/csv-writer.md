---
title: CSVWriter
description: Encode loaders.gl tables as CSV or delimiter-separated text.
hide_title: true
page_style: designed
---

import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  format="csv"
  eyebrow="CSV module · writer API"
  title="CSVWriter"
  description="Write loaders.gl tables back to CSV or another delimiter-separated text representation, including Arrow-backed tables produced by CSVLoader."
  tone="blue"
  meta={['From v4.0', 'CSV / TSV', 'Table output']}
  links={[
    {label: 'CSV format', to: '/docs/modules/tables/csv/formats/csv'},
    {label: 'CSV module', to: '/docs/modules/tables/csv'}
  ]}
/>

<CsvDocsTabs active="csvwriter" />

<DocOrientation
  eyebrow="What it accepts"
  title="Export the same table in a format people can open anywhere."
  description="CSVWriter accepts loaders.gl table data and turns it into interoperable text. Use it at the application boundary when a table needs to leave the binary pipeline."
  tone="blue"
  items={[
    {label: 'Input', value: 'Rows, columns, or Arrow-backed tables'},
    {label: 'Output', value: 'CSV or delimiter-separated text'},
    {label: 'Names', value: 'Optional display names from metadata'},
    {label: 'API', value: 'Async encode or synchronous text output'}
  ]}
/>

<ReferenceBoundary
  title="CSVWriter reference"
  description="The sections below document imports, encoding forms, and writer options."
  tone="blue"
/>

`CSVWriter` writes tabular data into comma-separated value and delimiter-separated value encoding.

## Usage

Use the format entry point with async core encoding. For synchronous or direct calls, use the bundled writer.

```typescript
import {encode, encodeText} from '@loaders.gl/core';
import type {Table} from 'apache-arrow';
import {CSVWriter} from '@loaders.gl/tables/csv';
import {CSVWriter as BundledCSVWriter} from '@loaders.gl/tables/csv/bundled';

declare const table: Table;

const data = await encode(table, CSVWriter); // ArrayBuffer
const isoText = await encodeText(table, CSVWriter, {csv: {timestampFormat: 'iso'}});
const text = BundledCSVWriter.encodeTextSync(table, {csv: {useDisplayNames: true}}); // string
```

`CSVWriter` accepts the Apache Arrow table returned by `CSVLoader` and loaders.gl row or columnar tables.

## CSVWriter Options

| Option                | Type      | Default | Description                                                                       |
| --------------------- | --------- | ------- | --------------------------------------------------------------------------------- |
| `csv.useDisplayNames` | `boolean` | `false` | If `true`, use field `metadata.displayName` values as column names when available. |
| `csv.timestampFormat` | `'number' \| 'iso'` | `'number'` | Native Arrow timestamp columns use Arrow's numeric values by default. Set `'iso'` to emit ISO-8601 UTC strings at the column's second, millisecond, microsecond or nanosecond precision. |

ISO formatting reads native timestamp storage without rounding through JavaScript
numbers. It preserves nulls, sliced/chunked columns and pre-epoch fractions. Timezone
metadata does not change the instant: values are emitted in UTC with `Z`. Timestamp
columns without timezone metadata use the same epoch-as-UTC convention. This option
has no effect on ordinary numeric or text columns, or on existing JavaScript `Date`
formatting in row tables. Values outside JavaScript's supported ISO calendar range
throw instead of emitting an invalid date.

Pass native Arrow tables directly, without a `{shape, data}` wrapper. The public
`encodeTable` and `encodeTableAsText` convenience APIs infer input types from the
writer too; `encodeText(table, CSVWriter, options)` is the general text encoding API.
