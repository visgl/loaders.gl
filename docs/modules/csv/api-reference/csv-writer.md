import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';

# CSVWriter

<CsvDocsTabs active="csvwriter" />

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square" alt="From-v4.0" />
</p>

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
