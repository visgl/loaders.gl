---
title: Table Loaders
description: Load row-based and columnar data through a shared table-oriented API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {CategoryDataConcept} from '@site/src/components/home/concepts';

<CapabilityHero capability="columnar" />

<DocPageHeader
  eyebrow="Loader category"
  title="Table loaders"
  description="Choose a table shape for your application, then let the input format vary behind the same processing path."
  tone="cyan"
  meta={['Rows and columns', 'Arrow-compatible', 'Streaming batches']}
  links={[
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<CategoryDataConcept initialCategoryId="table" initialRepresentationId="arrow" />

<DocOrientation
  eyebrow="The table path"
  title="Choose the shape that fits the next step."
  description="A table loader can return familiar rows, contiguous columns, or Arrow batches. The file format may change, but application code can keep the same basic handoff between loading, processing, and writing."
  tone="cyan"
  items={[
    {label: 'Rows', value: 'Convenient objects or arrays for application logic'},
    {label: 'Columns', value: 'Typed arrays for compact access and transfer'},
    {label: 'Arrow', value: 'A shared binary table shape for larger pipelines'},
    {label: 'Batches', value: 'Incremental results for streams and large files'}
  ]}
/>

Table loaders accept row-oriented text, binary columnar files, and Arrow interchange data. Choose
the returned shape based on what the next stage needs: rows are convenient for application logic,
columns are efficient for typed processing, and Arrow batches are useful when data must cross a
worker, scan, renderer, or writer boundary.

<ReferenceBoundary
  title="Table shapes and contracts"
  description="The reference below defines supported loaders, row and column representations, Arrow integration, accessors, and serialization details."
  tone="cyan"
/>

## Table Category Loaders

| Loader                                                          | Notes                              |
| --------------------------------------------------------------- | ---------------------------------- |
| [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader) |                                    |
| [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader)       |                                    |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader)    | Set `options.json.table` to `true` |

## Supported shapes

`options.core.shape` sets a shared default shape for loaders that support shape selection. `options[loaderId].shape` overrides `options.core.shape` for that loader.

| Shape | Loaders | Notes |
| --- | --- | --- |
| `arrow-table` | [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader) | Default for Arrow IPC parsing can still be overridden with `options.arrow.shape`. |
| `columnar-table` | [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader) | Column-major output for Arrow data. |
| `array-row-table` | [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader), [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader), [`JSONLoader`](/docs/modules/json/api-reference/json-loader) | Row arrays. Scoped overrides: `options.arrow.shape`, `options.csv.shape`, `options.json.shape`. |
| `object-row-table` | [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader), [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader), [`JSONLoader`](/docs/modules/json/api-reference/json-loader) | Row objects. Default for CSV. |

`GeoJSONLoader` uses `options.geojson.shape` for GIS-specific output shapes such as `geojson-table`, `binary-feature-collection`, and `arrow-table`.

## Data Structure

| Field    | Type                | Contents                                                     |
| -------- | ------------------- | ------------------------------------------------------------ |
| `shape`  | string union        | One of the supported shape strings for tables                |
| `schema` | `Object`            | Metadata of the table, maps name of each column to its type. |
| `data`   | `Object` or `Array` | Data of the table, see [table types](#table-types)           |

## Shapes

| Shape | Meaning |
| --- | --- |
| `'object-row-table'` | loaders.gl table wrapper storing rows as JavaScript objects |
| `'array-row-table'` | loaders.gl table wrapper storing rows as JavaScript arrays |
| `'columnar-table'` | loaders.gl table wrapper storing one column array per field |
| `'arrow-table'` | loaders.gl table wrapper whose `data` field is an Arrow table |
| `'geojson-table'` | loaders.gl GIS-oriented table wrapper storing features plus schema |
| `'arrow'` | raw Apache Arrow table value |
| `'geoarrow'` | raw Arrow table value with GeoArrow geometry metadata |

## Table Types

loaders.gl deals with (and offers utilities to convert between) three different types of tables:

### Classic Tables (Row-Major)

This is the classic JavaScript table. `data` consists of an `Array` of `Object` instances, each representing a row.

### Columnar Tables (Column-Major)

Columnar tables are stored as one array per column. Numeric columns can use typed arrays stored in
contiguous memory. `data` is an `Object` that maps column names to an array or typed array.

Contiguous memory has tremendous benefits:

- Values are adjacent in memory, so cache locality can improve processing performance
- Typed arrays can of course be efficiently transferred from worker threads to main thread
- They can be uploaded directly to a GPU for further processing.

### Chunked Columnar Tables (DataFrames)

A problem with columnar tables is that arrays can become very long, which complicates streaming and
memory allocation. Chunked columnar tables solve this by splitting each column into matching
sequences of typed arrays.

The tradeoff is additional coordination between batches. Data frames are useful when loading and
transforming large inputs because they can limit copying, reallocation, and movement while keeping
batch boundaries explicit.

Using the Arrow API it is possible to work extremely efficiently with very large (multi-gigabyte) datasets.

## Table Accessors

loaders.gl provides a range of table accessors.

| Accessor                                                                                           | Description                                                                            |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `getTableLength(table: Table): number`                                                             | Returns length (number of rows) in the table                                           |
| `getTableNumCols(table: Table): number`                                                            | Returns number of columns in the table                                                 |
| `getTableCell(table: Table, rowIndex: number, columnName: string): unknown`                        | Gets the value in a cell by column name and row index                                  |
| `getTableCellAt(table: Table, rowIndex: number, columnIndex: number): unknown`                     | Gets the value of a cell by column index and row index                                 |
| `getTableRowShape(table: Table): 'array-row-table' \| 'object-row-table'`                          | Gets the shape of each table row                                                       |
| `getTableColumnIndex(table: Table, columnName: string): number`                                    | Gets the index of a named column                                                       |
| `getTableColumnName(table: Table, columnIndex: number): string`                                    | Gets the name of a column by index                                                     |
| `getTableRowAsObject(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy')`           | Gets a row from the table. Parameters control whether a new object is created or reused. |
| `getTableRowAsArray(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy'): unknown[]` | Gets a row from the table. Parameters control whether a new array is created or reused. |
| `makeArrayRowTable(table: Table): ArrayRowTable`                                                   | Copies a table into 'array-row-table' format.                                          |
| `makeObjectRowTable(table: Table): ObjectRowTable`                                                 | Copies a table into 'object-row-table' format                                          |

## Apache Arrow support

loaders.gl has built-in support for Apache Arrow as a preferred in-memory binary columnar format.

### The Threading Issue

The Apache Arrow API is quite powerful, however there is a key limitation in that the Arrow Table classes do not serialize and deserialize when sending tables between threads.

It is of course possible to work with the underlying IPC data structure.

### Handling non-typed data

A JavaScript table has the freedom that a column can contain any type.

```typescript
const arrowTable = makeArrowTable(table).data;
```

## Serialized table representation

loaders.gl defines what is effectively a serialized representation of Apache Arrow schemas. These can be converted to Arrow tables with a simple transformation that is provided.

```typescript
import {makeTable} from 'apache-arrow';

const arrowTable = makeTable(...); // An arrow table
const table = serializeArrowTable(arrowTable); // A loaders.gl columnar table
const arrowTableCopy = deserializeArrowTable(table); // An arrow table

console.log(arrowTable.compareTo(arrowTableCopy));
```

Note: Currently the batch structure of a table is lost during serialization.
