---
title: CSV and delimited text format
description: Stream delimited records into row, columnar, or Arrow tables and write them back with explicit schema and delimiter options.
hide_title: true
page_style: designed
---

import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Delimited text format"
  title="Turn a text stream into a table."
  description="CSV, TSV, and related delimiter-separated files are simple to transport but varied in headers, quoting, types, and line endings. The CSV module makes those choices explicit and returns the same table shapes used by other loaders."
  tone="mint"
  meta={['CSV / TSV / DSV', 'Streaming parser', 'Arrow-compatible output']}
  links={[
    {label: 'CSV module', to: '/docs/modules/csv'},
    {label: 'CSVLoader', to: '/docs/modules/csv/api-reference/csv-loader'},
    {label: 'Using streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<CsvDocsTabs active="format" />

<DocOrientation
  eyebrow="Delimited data path"
  title="Parse as records, batches, or columns."
  description="The parser handles text incrementally and can expose the result in the form that the next operation needs. This is useful for ordinary application logic as well as large imports and browser-side analysis."
  tone="mint"
  items={[
    {label: 'Read', value: 'Handle delimiters, quoting, headers, and line endings.'},
    {label: 'Batch', value: 'Process records as they arrive with parseInBatches().'},
    {label: 'Shape', value: 'Return row, columnar, or Arrow-compatible tables.'},
    {label: 'Write', value: 'Emit delimited text with controlled columns and options.'}
  ]}
/>

<ReferenceBoundary
  title="CSV format and API details"
  description="The reference below covers dialect options, type inference, streaming, table output, and writer behavior."
  tone="mint"
/>

## Loaders and Writers

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/csv/api-reference/csv-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>CSVLoader</strong>
    <span>Loads CSV and TSV data as loaders.gl row, columnar, or Arrow tables.</span>
    <span className="docs-api-card__meta">Output: ObjectRowTable, ArrayRowTable, ColumnarTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseText, parseInBatches</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/csv/api-reference/csv-writer">
    <span className="docs-api-card__kind">Writer</span>
    <strong>CSVWriter</strong>
    <span>Writes loaders.gl row, columnar, or Arrow tables as comma-separated or delimiter-separated text.</span>
    <span className="docs-api-card__meta">Input: Table, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: encode, encodeTextSync</span>
  </a>
</div>

| Characteristic | Value                                               |
| -------------- | --------------------------------------------------- |
| File Format    | CSV, TSV, DSV                                       |
| Data Format    | [Tables](/docs/specifications/category-table)       |
| File Type      | Text                                                |
| File Extension | `.csv`, `.tsv`, `.dsv`                              |
| MIME Types     | `text/csv`, `text/tab-separated-values`, `text/dsv` |
