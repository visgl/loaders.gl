Binary columnar data

# Keep wide tables compact.

Use typed columns, selective reads, and Arrow-compatible batches to move large analytical datasets through the browser without turning every value into a JavaScript object.

ArrowParquetselective reads

Loader category

# Table loaders

Choose a table shape for your application, then let the input format vary behind the same processing path.

[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[Arrow​Loader↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[CSV​Loader↗](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[Excel​Loader↗](https://loaders.gl/next/docs/modules/tables/excel/api-reference/excel-loader.md)[JSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[NDJSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/ndjson-loader.md)[Parquet​Loader↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

Data

[Arrow table datashape: 'arrow-table'↗](https://loaders.gl/next/docs/specifications/category-table.md)

Encode

[Arrow​Writer↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[Parquet​Writer↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-writer.md)

The table path

## Choose the shape that fits the next step.

A table loader can return familiar rows, contiguous columns, or Arrow batches. The file format may change, but application code can keep the same basic handoff between loading, processing, and writing.

01

Rows

Convenient objects or arrays for application logic

02

Columns

Typed arrays for compact access and transfer

03

Arrow

A shared binary table shape for larger pipelines

04

Batches

Incremental results for streams and large files

Table loaders accept row-oriented text, binary columnar files, and Arrow interchange data. Choose the returned shape based on what the next stage needs: rows are convenient for application logic, columns are efficient for typed processing, and Arrow batches are useful when data must cross a worker, scan, renderer, or writer boundary.

Detailed guide

## Table shapes and contracts

The reference below defines supported loaders, row and column representations, Arrow integration, accessors, and serialization details.

## Table Category Loaders[​](#table-category-loaders "Direct link to Table Category Loaders")

| Loader                                                                                                | Notes                              |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md) |                                    |
| [`CSVLoader`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)       |                                    |
| [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)    | Set `options.json.table` to `true` |

## Supported shapes[​](#supported-shapes "Direct link to Supported shapes")

`options.core.shape` sets a shared default shape for loaders that support shape selection. `options[loaderId].shape` overrides `options.core.shape` for that loader.

| Shape              | Loaders                                                                                                                                                                                                                                                                                                    | Notes                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `arrow-table`      | [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)                                                                                                                                                                                                      | Default for Arrow IPC parsing can still be overridden with `options.arrow.shape`.               |
| `columnar-table`   | [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)                                                                                                                                                                                                      | Column-major output for Arrow data.                                                             |
| `array-row-table`  | [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md), [`CSVLoader`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md), [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md) | Row arrays. Scoped overrides: `options.arrow.shape`, `options.csv.shape`, `options.json.shape`. |
| `object-row-table` | [`ArrowLoader`](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md), [`CSVLoader`](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md), [`JSONLoader`](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md) | Row objects. Default for CSV.                                                                   |

`GeoJSONLoader` uses `options.geojson.shape` for GIS-specific output shapes such as `geojson-table`, `binary-feature-collection`, and `arrow-table`.

## Data Structure[​](#data-structure "Direct link to Data Structure")

| Field    | Type                | Contents                                                     |
| -------- | ------------------- | ------------------------------------------------------------ |
| `shape`  | string union        | One of the supported shape strings for tables                |
| `schema` | `Object`            | Metadata of the table, maps name of each column to its type. |
| `data`   | `Object` or `Array` | Data of the table, see [table types](#table-types)           |

## Shapes[​](#shapes "Direct link to Shapes")

| Shape                | Meaning                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `'object-row-table'` | loaders.gl table wrapper storing rows as JavaScript objects        |
| `'array-row-table'`  | loaders.gl table wrapper storing rows as JavaScript arrays         |
| `'columnar-table'`   | loaders.gl table wrapper storing one column array per field        |
| `'arrow-table'`      | loaders.gl table wrapper whose `data` field is an Arrow table      |
| `'geojson-table'`    | loaders.gl GIS-oriented table wrapper storing features plus schema |
| `'arrow'`            | raw Apache Arrow table value                                       |
| `'geoarrow'`         | raw Arrow table value with GeoArrow geometry metadata              |

## Table Types[​](#table-types "Direct link to Table Types")

loaders.gl deals with (and offers utilities to convert between) three different types of tables:

### Classic Tables (Row-Major)[​](#classic-tables-row-major "Direct link to Classic Tables (Row-Major)")

This is the classic JavaScript table. `data` consists of an `Array` of `Object` instances, each representing a row.

### Columnar Tables (Column-Major)[​](#columnar-tables-column-major "Direct link to Columnar Tables (Column-Major)")

Columnar tables are stored as one array per column. Numeric columns can use typed arrays stored in contiguous memory. `data` is an `Object` that maps column names to an array or typed array.

Contiguous memory has tremendous benefits:

* Values are adjacent in memory, so cache locality can improve processing performance
* Typed arrays can of course be efficiently transferred from worker threads to main thread
* They can be uploaded directly to a GPU for further processing.

### Chunked Columnar Tables (DataFrames)[​](#chunked-columnar-tables-dataframes "Direct link to Chunked Columnar Tables (DataFrames)")

A problem with columnar tables is that arrays can become very long, which complicates streaming and memory allocation. Chunked columnar tables solve this by splitting each column into matching sequences of typed arrays.

The tradeoff is additional coordination between batches. Data frames are useful when loading and transforming large inputs because they can limit copying, reallocation, and movement while keeping batch boundaries explicit.

Using the Arrow API it is possible to work extremely efficiently with very large (multi-gigabyte) datasets.

## Table Accessors[​](#table-accessors "Direct link to Table Accessors")

loaders.gl provides a range of table accessors.

| Accessor                                                                                           | Description                                                                              |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `getTableLength(table: Table): number`                                                             | Returns length (number of rows) in the table                                             |
| `getTableNumCols(table: Table): number`                                                            | Returns number of columns in the table                                                   |
| `getTableCell(table: Table, rowIndex: number, columnName: string): unknown`                        | Gets the value in a cell by column name and row index                                    |
| `getTableCellAt(table: Table, rowIndex: number, columnIndex: number): unknown`                     | Gets the value of a cell by column index and row index                                   |
| `getTableRowShape(table: Table): 'array-row-table' \| 'object-row-table'`                          | Gets the shape of each table row                                                         |
| `getTableColumnIndex(table: Table, columnName: string): number`                                    | Gets the index of a named column                                                         |
| `getTableColumnName(table: Table, columnIndex: number): string`                                    | Gets the name of a column by index                                                       |
| `getTableRowAsObject(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy')`           | Gets a row from the table. Parameters control whether a new object is created or reused. |
| `getTableRowAsArray(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy'): unknown[]` | Gets a row from the table. Parameters control whether a new array is created or reused.  |
| `makeArrayRowTable(table: Table): ArrayRowTable`                                                   | Copies a table into 'array-row-table' format.                                            |
| `makeObjectRowTable(table: Table): ObjectRowTable`                                                 | Copies a table into 'object-row-table' format                                            |

## Apache Arrow support[​](#apache-arrow-support "Direct link to Apache Arrow support")

loaders.gl has built-in support for Apache Arrow as a preferred in-memory binary columnar format.

### The Threading Issue[​](#the-threading-issue "Direct link to The Threading Issue")

The Apache Arrow API is quite powerful, however there is a key limitation in that the Arrow Table classes do not serialize and deserialize when sending tables between threads.

It is of course possible to work with the underlying IPC data structure.

### Handling non-typed data[​](#handling-non-typed-data "Direct link to Handling non-typed data")

A JavaScript table has the freedom that a column can contain any type.

```
const arrowTable = makeArrowTable(table).data;
```

## Serialized table representation[​](#serialized-table-representation "Direct link to Serialized table representation")

Use Arrow IPC to serialize an Arrow table. The schema and record batches travel with the encoded column buffers.

```
import {tableFromArrays, tableToIPC, tableFromIPC} from 'apache-arrow';



const arrowTable = tableFromArrays({id: [1, 2, 3]});

const bytes = tableToIPC(arrowTable);

const arrowTableCopy = tableFromIPC(bytes);

console.log(arrowTableCopy.numRows); // 3
```

For loaders.gl table-shape conversion, see [schema utilities](https://loaders.gl/next/docs/modules/core/schema-utils.md).
