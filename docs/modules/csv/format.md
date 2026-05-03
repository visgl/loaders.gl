import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSV Format

<CsvDocsTabs active="format" />

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
