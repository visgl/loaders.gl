CSV module · loader API

CSV

# CSVLoader

Load CSV and TSV text into a table shape that suits the next stage of your application, from familiar JavaScript rows to typed Apache Arrow columns.

[CSV format](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[CSV module](https://loaders.gl/next/docs/modules/tables/csv.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/csv.md)

⛶⛶ Explore fullscreen

CSV[Try It](https://loaders.gl/next/examples/geospatial/csv)[Overview](https://loaders.gl/next/docs/modules/tables/csv/formats/csv.md)[Format](https://loaders.gl/next/docs/modules/tables/csv/format.md)[CSVLoader](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[CSVWriter](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-writer.md)[Benchmarks](https://loaders.gl/next/docs/modules/tables/csv/benchmarks.md)

What it returns

## Start with rows. Move to columns when the pipeline grows.

CSVLoader keeps the simple path simple, then offers columnar and Arrow representations for typed data, geometry columns, and more efficient handoffs.

01

Object rows

Readable records for application code

02

Columnar

Columns without row-object overhead

03

Arrow

Typed, binary-compatible table data

04

Geometry

Optional WKT and WKB detection

Detailed guide

## CSVLoader reference

The sections below cover usage, bundle boundaries, headers, typing, geometry columns, and all loader options.

`CSVLoader` loads CSV and TSV data as loaders.gl `ArrowTable` objects by default. Set `csv.shape: 'object-row-table'`, `csv.shape: 'array-row-table'`, or `csv.shape: 'columnar-table'` to request a row or columnar table instead.

## Usage[​](#usage "Direct link to Usage")

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load(url, CSVLoader);
```

The CSV format export is metadata-only and works with async core APIs such as `load`, `parse`, and `parseInBatches`, which preload the parser implementation when needed. Applications that need a parser-bearing loader object directly can import it from the explicit loader subpath:

```
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv/csv-loader';
```

The bare `@loaders.gl/tables/csv` entry point is the metadata-only import. Core async APIs call `preload()` and dynamically import the parser-bearing implementation when parsing starts.

See [Metadata loaders and parser loading](https://loaders.gl/next/docs/developer-guide/using-metadata-loaders.md) for the bundle-splitting model and preload behavior.

```
import {parse} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const data = await parse(csvText, CSVLoader);
```

### Header Detection[​](#header-detection "Direct link to Header Detection")

A complication with the CSV format is that CSV files can come with or without an initial header line. While `CSVLoader` attempts to detect if the first line is a header, this can fail. If you know the file shape, use `options.csv.header` to specify how to handle the first line.

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const data = await load(urlToCSVWithHeader, CSVLoader, {csv: {header: true}});

const rows = await load(urlToCSVWithoutHeader, CSVLoader, {

  csv: {header: false, shape: 'object-row-table'}

});
```

### Apache Arrow[​](#apache-arrow "Direct link to Apache Arrow")

When `csv.shape: 'arrow-table'` is selected, `CSVLoader` returns a loaders.gl `ArrowTable` object that wraps an Apache Arrow table.

### Type Inference[​](#type-inference "Direct link to Type Inference")

`csv.dynamicTyping` controls inference of numeric, boolean, and date values. Set it explicitly to `false` to preserve text as Arrow `Utf8` columns, or to `true` to infer typed columns. The loader's public default is `true`.

```
import {load} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const table = await load(url, CSVLoader, {

  csv: {shape: 'arrow-table', dynamicTyping: false}

});

const typedTable = await load(url, CSVLoader, {

  csv: {shape: 'arrow-table', dynamicTyping: true}

});
```

For the `csv.dynamicTyping: false` Arrow path, `CSVLoader.parse(ArrayBuffer)` uses a byte-oriented parser for supported CSV options and creates Arrow `Utf8` columns without materializing per-cell JavaScript strings. `CSVLoader.parseText` encodes text to UTF-8 and uses the same byte-oriented path when possible. `CSVLoader.parseInBatches` uses the byte-oriented path when the input can be emitted as one batch, and keeps the streaming string parser for explicit batch sizes.

Set `csv.viewTypes: 'prefer'` to emit `Utf8View` columns when the installed `apache-arrow` runtime supports them, while falling back to `Utf8` with older runtimes. Use `'require'` to throw instead of falling back. The default `'never'` preserves compatibility with Arrow 17 and consumers that do not support view types.

### Geometry Columns[​](#geometry-columns "Direct link to Geometry Columns")

`CSVLoader` can detect WKT and hex-encoded WKB geometry columns when `csv.detectGeometryColumns` is enabled. Detected geometries are emitted as `geoarrow.wkb` by default. Set the common `geoarrow.encodingPreference` option to `'optimized'` for native coordinate buffers or `'geoarrow.geometry'` for a stable dense union. Set `csv.geometryEncoding: 'source'` to preserve WKT columns as `geoarrow.wkt` when using the default WKT/WKB bridge.

```
const table = await load(url, CSVLoader, {

  csv: {shape: 'arrow-table', detectGeometryColumns: true},

  geoarrow: {encodingPreference: 'optimized'}

});
```

## CSVLoader Options[​](#csvloader-options "Direct link to CSVLoader Options")

| Option                        | Type                                                                           | Default                  | Description                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `csv.shape`                   | `'object-row-table' \| 'array-row-table' \| 'columnar-table' \| 'arrow-table'` | `arrow-table`            | Output rows as objects, arrays of values, columns, or Apache Arrow columns.                                                                  |
| `csv.optimizeMemoryUsage`     | `boolean`                                                                      | `false`                  | Optimize memory usage at the cost of additional parsing time.                                                                                |
| `csv.header`                  | `boolean \| 'auto'`                                                            | `auto`                   | If `true`, treat the first row as field names. If `false`, treat the first row as data. `'auto'` attempts to detect headers.                 |
| `csv.columnPrefix`            | `string`                                                                       | `column`                 | Prefix used when generating column names for files without headers, for example `column1`, `column2`, ...                                    |
| `csv.quoteChar`               | `string`                                                                       | `"`                      | Character used to quote fields.                                                                                                              |
| `csv.escapeChar`              | `string`                                                                       | `"`                      | Character used to escape the quote character within a field.                                                                                 |
| `csv.dynamicTyping`           | `boolean`                                                                      | `true`                   | Convert numeric and boolean values from strings to their native types.                                                                       |
| `csv.viewTypes`               | `'never' \| 'prefer' \| 'require'`                                             | `'never'`                | Controls whether Arrow output uses supported `Utf8View` columns.                                                                             |
| `csv.comments`                | `boolean`                                                                      | `false`                  | Skip lines that start with a comment indicator.                                                                                              |
| `csv.skipEmptyLines`          | `boolean \| 'greedy'`                                                          | `true`                   | Skip empty lines; `'greedy'` also skips lines that only contain whitespace.                                                                  |
| `csv.detectGeometryColumns`   | `boolean`                                                                      | `false`                  | Detect geometry columns when producing geospatial table output.                                                                              |
| `csv.geometryEncoding`        | `'wkb' \| 'source'`                                                            | `wkb`                    | Output encoding for detected geometry columns. `wkb` normalizes WKT and WKB to `geoarrow.wkb`; `source` preserves WKT.                       |
| `geoarrow.encodingPreference` | `'geoarrow.wkb' \| 'geoarrow.geometry' \| 'optimized'`                         | `'geoarrow.wkb'`         | Representation for detected geometry columns. `optimized` uses concrete native GeoArrow for homogeneous data and dense union for mixed data. |
| `csv.delimitersToGuess`       | `string[]`                                                                     | `[',', '\t', '\|', ';']` | Delimiters to try when no delimiter is specified.                                                                                            |

## Remarks[​](#remarks "Direct link to Remarks")

`CSVWorkerLoader` is a deprecated alias for `CSVLoader`.
