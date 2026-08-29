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
  eyebrow="CSV module · writer API"
  title="CSVWriter"
  description="Write loaders.gl tables back to CSV or another delimiter-separated text representation, including Arrow-backed tables produced by CSVLoader."
  tone="blue"
  meta={['From v4.0', 'CSV / TSV', 'Table output']}
  links={[
    {label: 'CSV format', to: '/docs/modules/csv/formats/csv'},
    {label: 'CSV module', to: '/docs/modules/csv'}
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

```typescript
import {encode} from '@loaders.gl/core';
import type {Table} from '@loaders.gl/schema';
import {CSVWriter} from '@loaders.gl/csv';

declare const table: Table;

const data = await encode(table, CSVWriter); // ArrayBuffer
const text = CSVWriter.encodeTextSync(table, {csv: options}); // string
```

`CSVWriter` can also encode Arrow-backed tables returned by `CSVLoader` with `csv.shape: 'arrow-table'`.

## CSVWriter Options

| Option                | Type      | Default | Description                                                                       |
| --------------------- | --------- | ------- | --------------------------------------------------------------------------------- |
| `csv.useDisplayNames` | `boolean` | `false` | If `true`, use field `metadata.displayName` values as column names when available. |
