# Table Loaders

The _table_ category loaders supports loading tables in _row-based_, _columnar_ or _batched columnar_ formats.

## Table Category Loaders

| Loader                                                          | Notes                              |
| --------------------------------------------------------------- | ---------------------------------- |
| [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader) |                                    |
| [`CSVLoader`](/docs/modules/csv/api-reference/csv-loader)       |                                    |
| [`JSONLoader`](/docs/modules/json/api-reference/json-loader)    | Set `options.json.table` to `true` |

## Data Structure

| Field    | Type                | Contents                                                     |
| -------- | ------------------- | ------------------------------------------------------------ |
| `shape`  | string union        | One of the supported shape strings for tables                |
| `schema` | `Object`            | Metadata of the table, maps name of each column to its type. |
| `data`   | `Object` or `Array` | Data of the table, see [table types](#table-types)           |

## Table Types

loaders.gl deals with (and offers utilities to convert between) three different types of tables:

### Classic Tables (Row-Major)

This is the classic JavaScript table. `data` consists of an `Array` of `Object` instances, each representing a row.

### Columnar Tables (Column-Major)

Columnar tables are stored as one array per column. Columns that are numeric can be loaded as typed arrays which are stored in contigous memory. `data` is an `Object` that maps column names to an array or typed array.

Contiguous memory has tremendous benefits:

- Values are adjacent in memory, the resulting cache locality can result in big performance gains
- Typed arrays can of course be efficiently transferred from worker threads to main thread
- Can be directly uploaded to the GPU for further processing.

### Chunked Columnar Tables (DataFrames)

A problem with columnar tables is that column arrays they can get very long, causing issues with streaming, memory allication etc. A powerful solution is to worked with chunked columnar tables, where columns is are broken into matching sequences of typed arrays.

The down-side is that complexity can increase quickly. Data Frames are optimized to minimize the amount of copying/moving/reallocation of data during common operations such e.g. loading and transformations, and support zero-cost filtering through smart iterators etc.

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
| `getTableRowAsObject(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy')`           | Gets a row from the table. Parameters contol whether a new object is minted or reused. |
| `getTableRowAsArray(table: Table, rowIndex: number, target?: unknown[], copy?: 'copy'): unknown[]` | Gets a row from the table. Parameters contol whether a new array is minted or reused.  |
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

