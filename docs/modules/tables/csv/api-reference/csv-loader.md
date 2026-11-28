---
title: CSVLoader
description: Load CSV and TSV data into row, columnar, or Arrow table shapes.
hide_title: true
page_style: designed
---

import {CsvDocsTabs} from '@site/src/components/docs/csv-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  format="csv"
  eyebrow="CSV module · loader API"
  title="CSVLoader"
  description="Load CSV and TSV text into a table shape that suits the next stage of your application, from familiar JavaScript rows to typed Apache Arrow columns."
  tone="blue"
  meta={['From v1.0', 'CSV / TSV', 'Arrow output']}
  links={[
    {label: 'CSV format', to: '/docs/modules/tables/csv/formats/csv'},
    {label: 'CSV module', to: '/docs/modules/tables/csv'}
  ]}
/>

<DocLiveExample label="CSVLoader table map example" height="420px">
  <ClientExample kind="geospatial" format="CSV" />
</DocLiveExample>

<CsvDocsTabs active="csvloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Start with rows. Move to columns when the pipeline grows."
  description="CSVLoader keeps the simple path simple, then offers columnar and Arrow representations for typed data, geometry columns, and more efficient handoffs."
  tone="blue"
  items={[
    {label: 'Object rows', value: 'Readable records for application code'},
    {label: 'Columnar', value: 'Columns without row-object overhead'},
    {label: 'Arrow', value: 'Typed, binary-compatible table data'},
    {label: 'Geometry', value: 'Optional WKT and WKB detection'}
  ]}
/>

<ReferenceBoundary
  title="CSVLoader reference"
  description="The sections below cover usage, bundle boundaries, headers, typing, geometry columns, and all loader options."
  tone="blue"
/>

`CSVLoader` loads CSV and TSV data as native Apache Arrow `Table` objects by default. Set `csv.shape: 'object-row-table'`, `csv.shape: 'array-row-table'`, or `csv.shape: 'columnar-table'` to request a row or columnar table instead.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';

const table = await load(url, CSVLoader);
```

The CSV format export is metadata-only and works with async core APIs such as `load`, `parse`, and `parseInBatches`, which preload the parser implementation when needed. Applications that need a parser-bearing loader object directly can import it from the explicit loader subpath:

```typescript
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv/bundled';
```

The bare `@loaders.gl/tables/csv` entry point is the metadata-only import. Core async APIs call `preload()` and dynamically import the parser-bearing implementation when parsing starts.

See [Metadata loaders and parser loading](/docs/developer-guide/using-metadata-loaders) for the bundle-splitting model and preload behavior.

```typescript
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';

const data = await parse(csvText, CSVLoader);
```

### Browser worker

The CSV loader resolves its browser worker relative to the loader module. A bundler that supports module worker URLs in dependencies, such as Vite 8, can emit the worker automatically. If Vite 7 dependency optimization rewrites the worker URL incorrectly, add `@loaders.gl/tables/csv` to `optimizeDeps.exclude`. If your toolchain cannot relocate the worker URL, serve `@loaders.gl/tables/csv-worker.js` as a static asset and pass its served URL in `csv.workerUrl`.

### Header Detection

A complication with the CSV format is that CSV files can come with or without an initial header line. While `CSVLoader` attempts to detect if the first line is a header, this can fail. If you know the file shape, use `options.csv.header` to specify how to handle the first line.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';

const data = await load(urlToCSVWithHeader, CSVLoader, {csv: {header: true}});
const rows = await load(urlToCSVWithoutHeader, CSVLoader, {
  csv: {header: false, shape: 'object-row-table'}
});
```

### Apache Arrow

When `csv.shape: 'arrow'` is selected, `CSVLoader` returns a native Apache Arrow `Table`. Batched parsing yields native `RecordBatch` objects with Arrow schemas and metadata.

### Type Inference

`csv.dynamicTyping` controls inference of numeric, boolean, and date values. Set it explicitly to `false` to preserve text as Arrow `Utf8` columns, or to `true` to infer typed columns. The loader's public default is `true`.

With dynamic typing enabled, CSV streaming and CSVTableSource default to `csv.schemaInference: 'first-batch'`. They sample up to 1,024 data records, capped by a smaller explicit `core.batchSize`. Set `csv.schemaInference: 'full'` to include late records before emitting data. Whole-file parsing defaults to full inference. Mixed sampled value types widen to text. After an Arrow column's type freezes, incompatible late values are converted according to that type, or stored as null when they cannot be converted. Row-table output preserves parsed cell values. Streaming Arrow output uses the column names and width established by its header or first record. Extra cells in the first batch can add a `__parsed_extra` column. Use full inference if extra cells only appear later.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';

const table = await load(url, CSVLoader, {
  csv: {shape: 'arrow', dynamicTyping: false}
});
const typedTable = await load(url, CSVLoader, {
  csv: {shape: 'arrow', dynamicTyping: true}
});
```

For the `csv.dynamicTyping: false` Arrow path, `CSVLoader.parse(ArrayBuffer)` uses a byte-oriented parser for supported CSV options and creates Arrow `Utf8` columns without materializing per-cell JavaScript strings. `CSVLoader.parseText` encodes text to UTF-8 and uses the same byte-oriented path when possible. `CSVLoader.parseInBatches` uses the byte-oriented path when the input can be emitted as one batch, and keeps the streaming string parser for explicit batch sizes.

Set `csv.viewTypes: 'prefer'` to emit `Utf8View` columns when the installed `apache-arrow` runtime supports them, while falling back to `Utf8` with older runtimes. Use `'require'` to throw instead of falling back. The default `'never'` preserves compatibility with Arrow 17 and consumers that do not support view types.

### Geometry Columns

`CSVLoader` can detect WKT and hex-encoded WKB geometry columns when `csv.detectGeometryColumns` is enabled. Detected geometries are emitted as `geoarrow.wkb` by default. Set the common `geoarrow.encodingPreference` option to `'optimized'` for native coordinate buffers or `'geoarrow.geometry'` for a stable dense union. Set `csv.geometryEncoding: 'source'` to preserve WKT columns as `geoarrow.wkt` when using the default WKT/WKB bridge.

```typescript
const table = await load(url, CSVLoader, {
  csv: {shape: 'arrow', detectGeometryColumns: true},
  geoarrow: {encodingPreference: 'optimized'}
});
```

## Data sources

Pass `CSVLoader` to [`createDataSource()`](/docs/modules/core/api-reference/create-data-source)
to open a URL or Blob for table queries. Use `load()` to parse the input into a table.


## CSVLoader Options

| Option                      | Type                                                                                       | Default                       | Description                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `csv.shape`                 | `'arrow' \| 'object-row-table' \| 'array-row-table' \| 'columnar-table'`             | `'arrow'` | Output rows as objects, arrays of values, columns, or Apache Arrow columns.                                                  |
| `csv.optimizeMemoryUsage`   | `boolean`                                                                                  | `false`                       | Optimize memory usage at the cost of additional parsing time.                                                                |
| `csv.header`                | `boolean \| 'auto'`                                                                        | `auto`                        | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers. |
| `csv.columnPrefix`          | `string`                                                                                   | `column`                      | Prefix used when generating column names for files without headers, for example `column1`, `column2`, ...                    |
| `csv.quoteChar`             | `string`                                                                                   | `"`                           | Character used to quote fields.                                                                                              |
| `csv.escapeChar`            | `string`                                                                                   | `"`                           | Character used to escape the quote character within a field.                                                                 |
| `csv.dynamicTyping`         | `boolean`                                                                                  | `true`                        | Convert numeric and boolean values from strings to their native types.                                                       |
| `csv.viewTypes`             | `'never' \| 'prefer' \| 'require'`                                                        | `'never'`                     | Controls whether Arrow output uses supported `Utf8View` columns.                                                             |
| `csv.comments`              | `boolean`                                                                                  | `false`                       | Skip lines that start with a comment indicator.                                                                              |
| `csv.skipEmptyLines`        | `boolean \| 'greedy'`                                                                      | `true`                        | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                  |
| `csv.detectGeometryColumns` | `boolean`                                                                                  | `false`                       | Detect geometry columns when producing geospatial table output.                                                              |
| `csv.geometryEncoding`      | `'wkb' \| 'source'`                                                                        | `wkb`                         | Output encoding for detected geometry columns. `wkb` normalizes WKT and WKB to `geoarrow.wkb`; `source` preserves WKT.       |
| `geoarrow.encodingPreference` | `'geoarrow.wkb' \| 'geoarrow.geometry' \| 'optimized'` | `'geoarrow.wkb'` | Representation for detected geometry columns. `optimized` uses concrete native GeoArrow for homogeneous data and dense union for mixed data. |
| `csv.delimitersToGuess`     | `string[]`                                                                                 | `[',', '\t', '\|', ';']`      | Delimiters to try when no delimiter is specified.                                                                            |

## Remarks
